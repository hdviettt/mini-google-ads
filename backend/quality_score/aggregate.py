"""Combine pCTR + ad relevance + LP experience into a single 1..10
Quality Score, mirroring how Google describes the inputs (without
disclosing exact weights)."""
from __future__ import annotations
from dataclasses import dataclass

from .pctr import compute_pctr, normalize_pctr_to_score
from .ad_relevance import compute_ad_relevance
from .lp_experience import compute_lp_experience


@dataclass
class QualityScoreBreakdown:
    pctr: float                # raw probability in [0, 1]
    pctr_score: float          # 1..10
    ad_relevance: float        # 1..10
    lp_experience: float       # 1..10
    quality_score: float       # 1..10 final


# Weights chosen so each component visibly moves the final score.
W_PCTR = 0.50
W_RELEVANCE = 0.30
W_LP = 0.20


def compute_quality_score(
    query: str,
    keyword_text: str,
    match_type: str,
    headlines: list[str],
    descriptions: list[str],
    lp_load_ms: int,
    lp_content_score: float,
    advertiser_quality: float = 0.0,
) -> QualityScoreBreakdown:
    pctr = compute_pctr(
        query=query,
        keyword_text=keyword_text,
        headlines=headlines,
        match_type=match_type,
        advertiser_quality=advertiser_quality,
    )
    pctr_score = normalize_pctr_to_score(pctr)
    ad_rel = compute_ad_relevance(query, keyword_text, headlines, descriptions)
    lp = compute_lp_experience(lp_load_ms, lp_content_score)

    qs = W_PCTR * pctr_score + W_RELEVANCE * ad_rel + W_LP * lp
    qs = max(1.0, min(10.0, qs))

    return QualityScoreBreakdown(
        pctr=pctr,
        pctr_score=pctr_score,
        ad_relevance=ad_rel,
        lp_experience=lp,
        quality_score=qs,
    )
