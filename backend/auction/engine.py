"""End-to-end auction orchestration.

query -> match -> pick best ad -> Quality Score -> bid strategy ->
Ad Rank -> GSP -> slots -> persist.

Phase 4 added the bid-strategy step. Manual CPC keeps using the
keyword's max_cpc_bid. Smart Bidding strategies (Maximize Conversions /
Target ROAS / Target CPA) use the LightGBM pCVR model (or its
fallback) to decide a bid per impression."""
from __future__ import annotations
import json
import time
from dataclasses import dataclass

from matching.dispatcher import find_all_matches
from quality_score.baseline import baseline_quality_score
from quality_score.aggregate import compute_quality_score, QualityScoreBreakdown
from quality_score.ad_relevance import compute_ad_relevance
from auction.ad_rank import compute_ad_rank
from auction.slot_allocation import Bidder, allocate_slots, DEFAULT_RESERVE_AD_RANK
from narration.llm import narrate_auction_llm as narrate_auction
from bidding.features import extract_features
from bidding.strategy import decide_bid, StrategyDecision
from models import AdRankLine, AuctionResponse


@dataclass
class _AdContext:
    ad_id: int
    headline: str
    headlines: list[str]
    descriptions: list[str]
    final_url: str
    lp_load_ms: int
    lp_content_score: float


def _pick_best_ad(conn, campaign_id: int, query: str, keyword_text: str) -> _AdContext | None:
    rows = conn.execute(
        """
        SELECT id, headlines, descriptions, final_url, lp_load_ms, lp_content_score
        FROM ads WHERE campaign_id = %s
        """,
        (campaign_id,),
    ).fetchall()
    if not rows:
        return None
    best: _AdContext | None = None
    best_score = -1.0
    for r in rows:
        headlines = r[1] if isinstance(r[1], list) else json.loads(r[1])
        descriptions = r[2] if isinstance(r[2], list) else json.loads(r[2])
        score = compute_ad_relevance(query, keyword_text, headlines, descriptions)
        if score > best_score:
            best_score = score
            headline = headlines[0] if headlines else ""
            best = _AdContext(
                ad_id=r[0],
                headline=headline,
                headlines=headlines,
                descriptions=descriptions,
                final_url=r[3],
                lp_load_ms=r[4],
                lp_content_score=float(r[5]),
            )
    return best


def _advertiser_quality_signal(advertiser_id: int) -> float:
    base = baseline_quality_score(advertiser_id)
    return max(-1.0, min(1.0, (base - 5.5) / 4.5))


def _resolve_quality_score(
    advertiser_id: int,
    breakdown: QualityScoreBreakdown,
    qs_overrides: dict[int, float] | None,
) -> tuple[float, QualityScoreBreakdown]:
    if qs_overrides and advertiser_id in qs_overrides:
        target = float(qs_overrides[advertiser_id])
        target = max(1.0, min(10.0, target))
        scale = target / breakdown.quality_score if breakdown.quality_score > 0 else 1.0
        return target, QualityScoreBreakdown(
            pctr=breakdown.pctr,
            pctr_score=max(1.0, min(10.0, breakdown.pctr_score * scale)),
            ad_relevance=max(1.0, min(10.0, breakdown.ad_relevance * scale)),
            lp_experience=max(1.0, min(10.0, breakdown.lp_experience * scale)),
            quality_score=target,
        )
    return breakdown.quality_score, breakdown


def _get_user_features(conn, user_id: int | None) -> tuple[str, str, str]:
    """Return (intent_level, device, geo). Defaults when user_id is None."""
    if user_id is None:
        return ("medium", "mobile", "HCM")
    row = conn.execute(
        "SELECT intent_level, device, geo FROM users WHERE id = %s",
        (user_id,),
    ).fetchone()
    if not row:
        return ("medium", "mobile", "HCM")
    return (row[0], row[1], row[2])


def run_auction(
    conn,
    query: str,
    user_id: int | None = None,
    num_slots: int = 4,
    bid_overrides: dict[int, float] | None = None,
    qs_overrides: dict[int, float] | None = None,
    persist: bool = True,
) -> AuctionResponse:
    started = time.perf_counter()

    matched = find_all_matches(conn, query)

    auction_id = 0
    query_id = 0
    if persist:
        query_id = conn.execute(
            "INSERT INTO queries (user_id, text) VALUES (%s, %s) RETURNING id",
            (user_id, query),
        ).fetchone()[0]
        auction_id = conn.execute(
            "INSERT INTO auctions (query_id) VALUES (%s) RETURNING id",
            (query_id,),
        ).fetchone()[0]

    intent_level, device, geo = _get_user_features(conn, user_id)

    bidders: list[Bidder] = []
    line_meta: list[dict] = []

    for m in matched:
        ad = _pick_best_ad(conn, m["campaign_id"], query, m["keyword_text"])
        if ad is None:
            continue

        breakdown = compute_quality_score(
            query=query,
            keyword_text=m["keyword_text"],
            match_type=m["match_type"],
            headlines=ad.headlines,
            descriptions=ad.descriptions,
            lp_load_ms=ad.lp_load_ms,
            lp_content_score=ad.lp_content_score,
            advertiser_quality=_advertiser_quality_signal(m["advertiser_id"]),
        )
        qs, breakdown = _resolve_quality_score(m["advertiser_id"], breakdown, qs_overrides)

        # Bid: explicit override wins. Otherwise consult the strategy.
        if bid_overrides and m["advertiser_id"] in bid_overrides:
            bid = float(bid_overrides[m["advertiser_id"]])
            strategy_decision: StrategyDecision | None = None
        else:
            feature_row = extract_features(
                quality_score=qs,
                pctr=breakdown.pctr,
                ad_relevance=breakdown.ad_relevance,
                lp_experience=breakdown.lp_experience,
                slot_position=0,  # at bid time we assume best slot
                match_type=m["match_type"],
                intent_level=intent_level,
                device=device,
                geo=geo,
                vertical=m["vertical"],
            )
            strategy_decision = decide_bid(
                bid_strategy=m.get("bid_strategy", "manual_cpc"),
                max_cpc_bid=m["max_cpc_bid"],
                target_roas=m.get("target_roas"),
                target_cpa=m.get("target_cpa"),
                feature_row=feature_row,
                vertical=m["vertical"],
            )
            bid = strategy_decision.bid

        ad_rank = compute_ad_rank(bid, qs)
        key = len(bidders)
        bidders.append(Bidder(key=key, bid=bid, quality_score=qs, ad_rank=ad_rank))
        line_meta.append({
            "advertiser_id": m["advertiser_id"],
            "advertiser_name": m["advertiser_name"],
            "campaign_id": m["campaign_id"],
            "keyword_id": m["keyword_id"],
            "keyword_text": m["keyword_text"],
            "match_type": m["match_type"],
            "ad_id": ad.ad_id,
            "ad_headline": ad.headline,
            "bid": bid,
            "quality_score": qs,
            "pctr": breakdown.pctr,
            "ad_relevance": breakdown.ad_relevance,
            "lp_experience": breakdown.lp_experience,
            "ad_rank": ad_rank,
            "bid_strategy": m.get("bid_strategy", "manual_cpc"),
            "strategy_reason": strategy_decision.reason if strategy_decision else "manual override",
            "predicted_pcvr": strategy_decision.pcvr if strategy_decision else 0.0,
        })

    slot_results = allocate_slots(bidders, num_slots) if bidders else []

    lines: list[AdRankLine] = []
    for meta, (slot_pos, paid_cpc) in zip(line_meta, slot_results):
        lines.append(AdRankLine(
            advertiser_id=meta["advertiser_id"],
            advertiser_name=meta["advertiser_name"],
            campaign_id=meta["campaign_id"],
            keyword_id=meta["keyword_id"],
            keyword_text=meta["keyword_text"],
            match_type=meta["match_type"],
            ad_id=meta["ad_id"],
            ad_headline=meta["ad_headline"],
            bid=meta["bid"],
            quality_score=meta["quality_score"],
            pctr=meta["pctr"],
            ad_relevance=meta["ad_relevance"],
            lp_experience=meta["lp_experience"],
            ad_rank=meta["ad_rank"],
            slot_position=slot_pos,
            paid_cpc=paid_cpc if slot_pos is not None else None,
            bid_strategy=meta.get("bid_strategy", "manual_cpc"),
            predicted_pcvr=meta.get("predicted_pcvr", 0.0),
            strategy_reason=meta.get("strategy_reason", ""),
        ))

    lines.sort(key=lambda l: l.ad_rank, reverse=True)

    if persist and auction_id:
        for line in lines:
            conn.execute(
                """
                INSERT INTO ad_rank_results
                  (auction_id, advertiser_id, keyword_id, ad_id, match_type,
                   bid, quality_score, pctr, ad_relevance, lp_experience,
                   ad_rank, slot_position, paid_cpc)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (auction_id, line.advertiser_id, line.keyword_id, line.ad_id,
                 line.match_type, line.bid, line.quality_score, line.pctr,
                 line.ad_relevance, line.lp_experience, line.ad_rank,
                 line.slot_position, line.paid_cpc),
            )
        conn.commit()

    matched_count = len(matched)
    eligible_count = sum(1 for b in bidders if b.ad_rank >= DEFAULT_RESERVE_AD_RANK)
    slot_count = sum(1 for line in lines if line.slot_position is not None)

    narration = narrate_auction(query, lines)

    return AuctionResponse(
        auction_id=auction_id,
        query=query,
        matched_count=matched_count,
        eligible_count=eligible_count,
        slot_count=slot_count,
        lines=lines,
        narration=narration,
        time_ms=(time.perf_counter() - started) * 1000.0,
    )
