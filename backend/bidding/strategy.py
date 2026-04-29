"""Bid strategies. Decide what bid to enter into the auction for a
given (advertiser, query, user) triple.

- manual_cpc: use the keyword's max_cpc_bid (legacy)
- maximize_conversions: bid up to budget pacing limit, model-aware
- target_roas: bid = pCVR * expected_value / target_roas
- target_cpa: bid = pCVR * target_cpa

The Smart Bidding strategies require a trained pCVR model. When the
model is not yet trained, they fall back to a calibrated baseline
(see pcvr_model._fallback_pcvr)."""
from __future__ import annotations
from dataclasses import dataclass

from .features import FeatureRow
from .pcvr_model import predict_pcvr


# Default expected conversion values per vertical, used by Target ROAS
# when we do not have the advertiser-specific override.
DEFAULT_AOV_VND = {
    "apparel": 800_000,
    "finance": 2_500_000,
    "travel":  3_500_000,
}

# Bid caps per strategy to prevent runaway bidding when the pCVR model is
# overconfident. Real systems have tighter pacing logic; we approximate.
BID_CAP_VND = {
    "manual_cpc":           50_000,
    "maximize_conversions": 35_000,
    "target_roas":          80_000,
    "target_cpa":           80_000,
}


@dataclass
class StrategyDecision:
    bid: float
    pcvr: float            # always populated, useful for telemetry
    reason: str            # short label for the UI


def decide_bid(
    bid_strategy: str,
    max_cpc_bid: float,
    target_roas: float | None,
    target_cpa: float | None,
    feature_row: FeatureRow,
    vertical: str,
) -> StrategyDecision:
    s = (bid_strategy or "manual_cpc").lower()

    if s == "manual_cpc":
        return StrategyDecision(
            bid=float(max_cpc_bid),
            pcvr=predict_pcvr(feature_row),
            reason="manual_cpc: max_cpc_bid",
        )

    pcvr = predict_pcvr(feature_row)

    if s == "maximize_conversions":
        # Without explicit budget pacing here, bid scales with pCVR but
        # is ceilinged. Higher pCVR -> bid more, capped by BID_CAP.
        bid = min(BID_CAP_VND["maximize_conversions"], 25_000 + 60_000 * pcvr)
        return StrategyDecision(bid=bid, pcvr=pcvr, reason=f"max_conv: pCVR={pcvr*100:.1f}%")

    if s == "target_roas" and target_roas and target_roas > 0:
        aov = DEFAULT_AOV_VND.get(vertical, 1_000_000)
        # bid = expected_value_per_click / target_roas
        # expected_value_per_click = pCVR * AOV
        bid = (pcvr * aov) / float(target_roas)
        bid = min(BID_CAP_VND["target_roas"], max(500.0, bid))
        return StrategyDecision(bid=bid, pcvr=pcvr, reason=f"target_roas={target_roas}: pCVR={pcvr*100:.2f}%")

    if s == "target_cpa" and target_cpa and target_cpa > 0:
        # bid = pCVR * target_cpa
        bid = pcvr * float(target_cpa)
        bid = min(BID_CAP_VND["target_cpa"], max(500.0, bid))
        return StrategyDecision(bid=bid, pcvr=pcvr, reason=f"target_cpa={int(target_cpa):,}: pCVR={pcvr*100:.2f}%")

    # Fallback to manual
    return StrategyDecision(
        bid=float(max_cpc_bid),
        pcvr=pcvr,
        reason="fallback to manual_cpc",
    )
