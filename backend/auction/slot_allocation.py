"""Slot allocation: take eligible bidders sorted by Ad Rank desc, take
top N that clear the reserve, and assign 0-indexed slot positions."""
from __future__ import annotations
from .gsp import Bidder, gsp_price, DEFAULT_RESERVE_AD_RANK


def allocate_slots(
    bidders: list[Bidder],
    num_slots: int,
    reserve_ad_rank: float = DEFAULT_RESERVE_AD_RANK,
) -> list[tuple[int, float]]:
    """Return a list of (position, paid_cpc) for each bidder in
    `bidders`. position is None for non-winners.

    Output is the same length as `bidders` so callers can map back
    by index. Position numbering is 0-indexed; UI can render as 1-indexed.
    """
    sorted_bidders = sorted(bidders, key=lambda b: b.ad_rank, reverse=True)
    eligible = [b for b in sorted_bidders if b.ad_rank >= reserve_ad_rank]
    winners = eligible[:num_slots]

    # Compute paid CPC for each winner. The "next ranker" for the GSP
    # formula must include any non-winning eligible bidder right after
    # the last winner, which is naturally what sorted_bidders gives us.
    winner_keys = {b.key for b in winners}
    out_by_key: dict[int, tuple[int | None, float]] = {b.key: (None, 0.0) for b in bidders}

    for i, b in enumerate(winners):
        # For position i, "next" is winners[i+1] if it exists, else the
        # next non-winning eligible bidder, else the reserve.
        if i + 1 < len(winners):
            next_ad_rank = winners[i + 1].ad_rank
        elif len(eligible) > num_slots:
            next_ad_rank = eligible[num_slots].ad_rank
        else:
            next_ad_rank = reserve_ad_rank
        if b.quality_score <= 0:
            paid = 0.0
        else:
            paid = min(next_ad_rank / b.quality_score, b.bid)
        out_by_key[b.key] = (i, paid)

    # Preserve input order
    return [out_by_key[b.key] for b in bidders]


__all__ = ["Bidder", "gsp_price", "allocate_slots"]
