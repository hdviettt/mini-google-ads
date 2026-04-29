"""Generalized Second-Price pricing.

Each winner pays the minimum CPC required to keep their Ad Rank above
the next-ranked advertiser, divided by their own Quality Score:

    price_i = AdRank_(i+1) / QS_i

Capped above by the advertiser's own bid (you never pay more than you
bid). The last winner has no next-ranked advertiser so they pay the
reserve floor instead.

This is the formula that makes "bid 10k, pay 6k" possible. The whole
project is built so this single function is unambiguously correct."""
from __future__ import annotations
from dataclasses import dataclass

# Reserve "Ad Rank" floor below which an ad is not eligible to show.
# Tunable; kept low so seed data with bids in the 4k-25k VND range
# produces a busy auction.
DEFAULT_RESERVE_AD_RANK = 1000.0


@dataclass
class Bidder:
    """One eligible advertiser line in an auction."""
    key: int               # ad_rank_results id or any unique handle for this line
    bid: float             # advertiser's max CPC bid
    quality_score: float   # in [1, 10]
    ad_rank: float         # bid * QS (or whatever ad_rank.py computed)


def gsp_price(
    sorted_bidders: list[Bidder],
    position: int,
    reserve_ad_rank: float = DEFAULT_RESERVE_AD_RANK,
) -> float:
    """Compute the GSP CPC for the bidder at `position` in the
    descending-Ad-Rank list.

    Args:
        sorted_bidders: bidders sorted by ad_rank desc (caller responsibility)
        position: 0-indexed position in the slot list

    Returns:
        CPC the advertiser pays per click, in VND.
    """
    if position < 0 or position >= len(sorted_bidders):
        raise IndexError("position out of range")
    me = sorted_bidders[position]
    if me.quality_score <= 0:
        return 0.0

    if position + 1 < len(sorted_bidders):
        next_ad_rank = sorted_bidders[position + 1].ad_rank
    else:
        # No next ranker: pay just enough to clear the reserve floor.
        next_ad_rank = reserve_ad_rank

    raw_price = next_ad_rank / me.quality_score
    # You never pay more than your max bid.
    return min(raw_price, me.bid)
