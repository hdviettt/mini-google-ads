"""Feature extraction for the Smart Bidding pCVR model.

Features mirror what real ad-tech uses for tabular pCVR prediction:
- Numeric: Quality Score components, slot position, hour of day
- Categorical: match type, intent level, device, geo, vertical

The extractor is pure-Python and works the same way at training and
inference time."""
from __future__ import annotations
from dataclasses import dataclass, asdict


# Stable column order used by the LightGBM model. If you change this,
# bump the model version and retrain.
NUMERIC_COLS = ["quality_score", "pctr", "ad_relevance", "lp_experience", "slot_position", "match_priority"]
CATEGORICAL_COLS = ["match_type", "intent_level", "device", "geo", "vertical"]
ALL_COLS = NUMERIC_COLS + CATEGORICAL_COLS

MATCH_PRIORITY = {"exact": 3, "phrase": 2, "broad": 1}


@dataclass
class FeatureRow:
    quality_score: float
    pctr: float
    ad_relevance: float
    lp_experience: float
    slot_position: int
    match_priority: int
    match_type: str
    intent_level: str
    device: str
    geo: str
    vertical: str

    def to_dict(self) -> dict:
        return asdict(self)


def extract_features(
    quality_score: float,
    pctr: float,
    ad_relevance: float,
    lp_experience: float,
    slot_position: int,
    match_type: str,
    intent_level: str,
    device: str,
    geo: str,
    vertical: str,
) -> FeatureRow:
    return FeatureRow(
        quality_score=float(quality_score),
        pctr=float(pctr),
        ad_relevance=float(ad_relevance),
        lp_experience=float(lp_experience),
        slot_position=int(slot_position),
        match_priority=MATCH_PRIORITY.get(match_type, 0),
        match_type=match_type,
        intent_level=intent_level,
        device=device,
        geo=geo,
        vertical=vertical,
    )
