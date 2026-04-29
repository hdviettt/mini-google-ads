"""End-to-end auction orchestration.

query -> match -> pick best ad -> Quality Score -> Ad Rank -> GSP -> slots -> persist.

Phase 3 swaps matching.exact for matching.dispatcher (broad/phrase).
Phase 4 swaps the bid lookup to consult bidding/strategy for
Smart Bidding strategies."""
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
from narration.template import narrate_auction
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
    """Pick the ad in this campaign whose copy best matches the query.

    Phase 2: ranks ads by ad_relevance score so the auction picks the
    most relevant headline for the query. This also seeds the
    QualityScoreBreakdown computed later in the pipeline."""
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
    """Map the seed baseline QS into a [-1, 1] bonus passed into pCTR.
    Lets premium brands have a small persistent CTR uplift."""
    base = baseline_quality_score(advertiser_id)
    return max(-1.0, min(1.0, (base - 5.5) / 4.5))


def _resolve_quality_score(
    advertiser_id: int,
    breakdown: QualityScoreBreakdown,
    qs_overrides: dict[int, float] | None,
) -> tuple[float, QualityScoreBreakdown]:
    """If user has overridden QS in the playground, scale the breakdown
    toward that target. Otherwise return the computed QS."""
    if qs_overrides and advertiser_id in qs_overrides:
        target = float(qs_overrides[advertiser_id])
        target = max(1.0, min(10.0, target))
        if breakdown.quality_score > 0:
            scale = target / breakdown.quality_score
        else:
            scale = 1.0
        return target, QualityScoreBreakdown(
            pctr=breakdown.pctr,
            pctr_score=max(1.0, min(10.0, breakdown.pctr_score * scale)),
            ad_relevance=max(1.0, min(10.0, breakdown.ad_relevance * scale)),
            lp_experience=max(1.0, min(10.0, breakdown.lp_experience * scale)),
            quality_score=target,
        )
    return breakdown.quality_score, breakdown


def _resolve_bid(advertiser_id: int, max_cpc_bid: float, bid_overrides: dict[int, float] | None) -> float:
    if bid_overrides and advertiser_id in bid_overrides:
        return float(bid_overrides[advertiser_id])
    return max_cpc_bid


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
        bid = _resolve_bid(m["advertiser_id"], m["max_cpc_bid"], bid_overrides)
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
        })

    if bidders:
        slot_results = allocate_slots(bidders, num_slots)
    else:
        slot_results = []

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
