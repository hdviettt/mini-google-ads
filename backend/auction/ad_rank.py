"""Ad Rank computation. Phase 1: Ad Rank = bid * Quality Score.
Real Google adds expected impact of asset extensions; we keep that as a
constant 1.0 multiplier here for clarity."""
from __future__ import annotations


def compute_ad_rank(bid: float, quality_score: float, asset_score: float = 1.0) -> float:
    """Ad Rank as Google describes it, with an asset_score multiplier
    held at 1.0 for Phase 1.

    Returns Ad Rank in the same currency unit as the bid (VND for our
    seed data) but treat it as a unitless ranking score."""
    if bid < 0:
        raise ValueError("bid must be non-negative")
    if not (0 <= quality_score <= 10):
        raise ValueError("quality_score must be in [0, 10]")
    return bid * quality_score * asset_score
