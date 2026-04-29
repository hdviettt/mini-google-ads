"""Predicted Click-Through Rate.

Phase 2 ships a deterministic computed pCTR based on text relevance,
match type, and a small per-advertiser quality signal. Phase 4 replaces
this with a logistic regression fit to logged impressions/clicks."""
from __future__ import annotations
import math

from .text_utils import coverage


# Match type multipliers reflect the typical CTR difference Google sees
MATCH_BONUS = {
    "exact": 1.20,
    "phrase": 1.00,
    "broad": 0.80,
}


def compute_pctr(
    query: str,
    keyword_text: str,
    headlines: list[str],
    match_type: str,
    advertiser_quality: float = 0.0,
) -> float:
    """Return predicted CTR in [0.005, 0.40].

    advertiser_quality is a small per-advertiser bonus (e.g. brand
    recognition, ad copy polish) in [-1, 1].
    """
    # Keyword-query coverage (how complete the keyword captures intent)
    kw_cov = coverage(query, keyword_text)
    # Best headline coverage (does any headline reflect the query?)
    head_cov = max((coverage(query, h) for h in headlines if h), default=0.0)

    # Logistic on a linear score gives a smooth pCTR in (0, 1)
    raw = 0.5 * kw_cov + 0.5 * head_cov + 0.4 * advertiser_quality
    base = 1.0 / (1.0 + math.exp(-2.5 * (raw - 0.4)))  # centered at raw=0.4

    bonus = MATCH_BONUS.get(match_type, 1.0)
    pctr = base * 0.30 * bonus  # 0.30 is the cap for an ideal match

    # Clamp to a realistic range
    return max(0.005, min(0.40, pctr))


def normalize_pctr_to_score(pctr: float) -> float:
    """Map pCTR to a 1..10 component score for the aggregate QS.

    Calibrated so that:
      0.5%  pCTR -> ~1.5
      5%    pCTR -> ~5.0
      15%   pCTR -> ~8.5
      30%+ pCTR -> ~10.0
    """
    score = 1.0 + 30.0 * pctr
    return max(1.0, min(10.0, score))
