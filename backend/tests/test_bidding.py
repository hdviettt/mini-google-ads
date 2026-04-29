"""Tests for bid strategies. The pCVR model fallback is exercised
since the actual LightGBM model needs training data we don't generate
in unit tests."""
from bidding.features import extract_features, ALL_COLS
from bidding.strategy import decide_bid
from bidding.pcvr_model import predict_pcvr, is_trained


def make_row(quality_score=7.0, pctr=0.08, ad_relevance=7.5, lp_experience=7.0,
             slot_position=0, match_type="exact", intent_level="medium",
             device="mobile", geo="HCM", vertical="apparel"):
    return extract_features(
        quality_score=quality_score, pctr=pctr, ad_relevance=ad_relevance,
        lp_experience=lp_experience, slot_position=slot_position,
        match_type=match_type, intent_level=intent_level,
        device=device, geo=geo, vertical=vertical,
    )


def test_feature_columns_stable():
    assert ALL_COLS[0] == "quality_score"
    assert "match_type" in ALL_COLS
    assert "vertical" in ALL_COLS


def test_manual_cpc_uses_max_cpc_bid():
    row = make_row()
    d = decide_bid(
        bid_strategy="manual_cpc",
        max_cpc_bid=8000,
        target_roas=None, target_cpa=None,
        feature_row=row, vertical="apparel",
    )
    assert d.bid == 8000.0


def test_target_cpa_uses_pcvr():
    """Target CPA: bid = pCVR * target_cpa. Higher pCVR -> higher bid."""
    high = make_row(quality_score=10.0, intent_level="high")
    low = make_row(quality_score=3.0, intent_level="low")

    d_high = decide_bid("target_cpa", 999_999, None, 250_000, high, "apparel")
    d_low = decide_bid("target_cpa", 999_999, None, 250_000, low, "apparel")

    assert d_high.bid > d_low.bid
    assert d_high.pcvr > d_low.pcvr


def test_target_roas_uses_pcvr_and_aov():
    """Target ROAS: higher pCVR -> higher bid (more value per click)."""
    high = make_row(quality_score=10.0, intent_level="high")
    low = make_row(quality_score=3.0, intent_level="low")
    d_high = decide_bid("target_roas", 999_999, 3.0, None, high, "travel")
    d_low = decide_bid("target_roas", 999_999, 3.0, None, low, "travel")
    assert d_high.bid > d_low.bid


def test_target_roas_inverse_of_target():
    """Higher target ROAS forces a lower bid (need more revenue per spend)."""
    row = make_row(quality_score=8.0, intent_level="high")
    low_roas = decide_bid("target_roas", 999_999, 2.0, None, row, "travel")
    high_roas = decide_bid("target_roas", 999_999, 5.0, None, row, "travel")
    assert low_roas.bid >= high_roas.bid


def test_unknown_strategy_falls_back_to_manual():
    row = make_row()
    d = decide_bid("nonsense", 7777, None, None, row, "apparel")
    assert d.bid == 7777.0
    assert "manual" in d.reason.lower()


def test_smart_bidding_changes_bid_per_user_intent():
    """Same query, same advertiser, different user intent -> different bid.
    This is the centerpiece of the Phase 4 demo."""
    row_high = make_row(intent_level="high")
    row_low = make_row(intent_level="low")
    bid_high = decide_bid("target_cpa", 999_999, None, 200_000, row_high, "apparel").bid
    bid_low = decide_bid("target_cpa", 999_999, None, 200_000, row_low, "apparel").bid
    assert bid_high > bid_low


def test_predict_pcvr_fallback_in_range():
    """Without a trained model, pCVR fallback is in (0, 1)."""
    p = predict_pcvr(make_row())
    assert 0.0 < p < 1.0
