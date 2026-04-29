"""End-to-end auction orchestration. Phase 1: query -> match -> Quality
Score -> Ad Rank -> GSP -> slots -> persist results.

Phase 2 swaps quality_score.baseline for quality_score.aggregate.
Phase 3 swaps matching.exact for matching.dispatcher (broad/phrase).
Phase 4 swaps the bid lookup to consult bidding/strategy for
Smart Bidding strategies."""
from __future__ import annotations
import json
import time
from dataclasses import dataclass

from matching.exact import find_matching_keywords
from quality_score.baseline import baseline_quality_score
from auction.ad_rank import compute_ad_rank
from auction.slot_allocation import Bidder, allocate_slots, DEFAULT_RESERVE_AD_RANK
from narration.template import narrate_auction
from models import AdRankLine, AuctionResponse


@dataclass
class _AdContext:
    ad_id: int
    headline: str


def _pick_top_ad(conn, campaign_id: int) -> _AdContext:
    """Pick the ad with the lowest id (deterministic) for now. Phase 2
    will pick the ad with highest ad relevance against the query."""
    row = conn.execute(
        "SELECT id, headlines FROM ads WHERE campaign_id = %s ORDER BY id LIMIT 1",
        (campaign_id,),
    ).fetchone()
    if not row:
        return _AdContext(0, "")
    headlines = row[1] if isinstance(row[1], list) else json.loads(row[1])
    headline = headlines[0] if headlines else ""
    return _AdContext(row[0], headline)


def _resolve_quality_score(advertiser_id: int, qs_overrides: dict[int, float] | None) -> float:
    if qs_overrides and advertiser_id in qs_overrides:
        return float(qs_overrides[advertiser_id])
    return baseline_quality_score(advertiser_id)


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

    matched = find_matching_keywords(conn, query)

    # Persist query + auction shells (so ad_rank_results has FKs to point to)
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

    # Build ad rank lines
    bidders: list[Bidder] = []
    line_meta: list[dict] = []  # parallel to bidders, stores everything not in Bidder
    for m in matched:
        ad_ctx = _pick_top_ad(conn, m["campaign_id"])
        qs = _resolve_quality_score(m["advertiser_id"], qs_overrides)
        bid = _resolve_bid(m["advertiser_id"], m["max_cpc_bid"], bid_overrides)
        ad_rank = compute_ad_rank(bid, qs)
        key = len(bidders)  # local index as Bidder.key
        bidders.append(Bidder(key=key, bid=bid, quality_score=qs, ad_rank=ad_rank))
        line_meta.append({
            "advertiser_id": m["advertiser_id"],
            "advertiser_name": m["advertiser_name"],
            "campaign_id": m["campaign_id"],
            "keyword_id": m["keyword_id"],
            "keyword_text": m["keyword_text"],
            "match_type": m["match_type"],
            "ad_id": ad_ctx.ad_id,
            "ad_headline": ad_ctx.headline,
            "bid": bid,
            "quality_score": qs,
            "ad_rank": ad_rank,
        })

    # Slot allocation
    if bidders:
        slot_results = allocate_slots(bidders, num_slots)
    else:
        slot_results = []

    # Build response lines
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
            pctr=0.0,            # filled in Phase 2
            ad_relevance=0.0,    # filled in Phase 2
            lp_experience=0.0,   # filled in Phase 2
            ad_rank=meta["ad_rank"],
            slot_position=slot_pos,
            paid_cpc=paid_cpc if slot_pos is not None else None,
        ))

    # Sort lines by ad_rank desc for nicer rendering
    lines.sort(key=lambda l: l.ad_rank, reverse=True)

    # Persist ad_rank_results
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
