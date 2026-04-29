"""Synthetic user click and conversion behavior. Each impression has
two random outcomes (click? convert?) driven by Quality Score,
slot position, match type, and the user's intent level."""
from __future__ import annotations
import random


# Position-bias CTR multipliers (slot 1 sees the most clicks)
SLOT_POSITION_BIAS = {0: 1.00, 1: 0.55, 2: 0.32, 3: 0.20, 4: 0.13}

INTENT_CTR_MULT = {"high": 1.7, "medium": 1.0, "low": 0.55}
INTENT_CVR_MULT = {"high": 4.0, "medium": 1.0, "low": 0.30}

MATCH_CTR_MULT = {"exact": 1.20, "phrase": 1.00, "broad": 0.80}

# Vertical -> realistic conversion value range in VND
VERTICAL_CVR_VALUE = {
    "apparel": (200_000, 1_500_000),
    "finance": (500_000, 5_000_000),
    "travel":  (1_000_000, 8_000_000),
}


def click_probability(
    quality_score: float,
    slot_position: int,
    match_type: str,
    intent_level: str,
) -> float:
    base = 0.04 * (quality_score / 5.0)  # QS 5 -> ~4% baseline
    pos_mult = SLOT_POSITION_BIAS.get(slot_position, 0.10)
    match_mult = MATCH_CTR_MULT.get(match_type, 1.0)
    intent_mult = INTENT_CTR_MULT.get(intent_level, 1.0)
    p = base * pos_mult * match_mult * intent_mult
    return max(0.001, min(0.45, p))


def conversion_probability(
    quality_score: float,
    intent_level: str,
    vertical: str,
) -> float:
    base = 0.05 * (quality_score / 6.0)  # QS 6 -> ~5% baseline conversion
    intent_mult = INTENT_CVR_MULT.get(intent_level, 1.0)
    p = base * intent_mult
    # Verticals differ slightly (finance has higher conversion friction)
    if vertical == "finance":
        p *= 0.7
    elif vertical == "travel":
        p *= 0.9
    return max(0.001, min(0.6, p))


def conversion_value(vertical: str, rng: random.Random | None = None) -> float:
    rng = rng or random
    lo, hi = VERTICAL_CVR_VALUE.get(vertical, (200_000, 1_000_000))
    # Log-normal-ish: most conversions near low end, occasional big ones
    u = rng.random() ** 1.5
    return lo + u * (hi - lo)
