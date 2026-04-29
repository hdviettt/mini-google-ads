from quality_score.pctr import compute_pctr, normalize_pctr_to_score
from quality_score.ad_relevance import compute_ad_relevance
from quality_score.lp_experience import compute_lp_experience
from quality_score.aggregate import compute_quality_score


def test_pctr_higher_when_keyword_matches_query_better():
    high = compute_pctr(
        query="vay du tiec",
        keyword_text="vay du tiec",
        headlines=["Vay Du Tiec Sang Trong"],
        match_type="exact",
    )
    low = compute_pctr(
        query="vay du tiec",
        keyword_text="thoi trang nu",
        headlines=["Thoi Trang Nu Cao Cap"],
        match_type="broad",
    )
    assert high > low


def test_pctr_match_type_bonus_orders_correctly():
    args = dict(
        query="vay du tiec",
        keyword_text="vay du tiec",
        headlines=["Vay Du Tiec"],
    )
    exact = compute_pctr(match_type="exact", **args)
    phrase = compute_pctr(match_type="phrase", **args)
    broad = compute_pctr(match_type="broad", **args)
    assert exact > phrase > broad


def test_pctr_score_calibration_monotonic():
    assert normalize_pctr_to_score(0.005) < normalize_pctr_to_score(0.05)
    assert normalize_pctr_to_score(0.05) < normalize_pctr_to_score(0.20)
    assert normalize_pctr_to_score(0.30) <= 10.0
    assert normalize_pctr_to_score(0.005) >= 1.0


def test_ad_relevance_higher_when_headline_contains_query():
    high = compute_ad_relevance(
        query="vay du tiec",
        keyword_text="vay du tiec",
        headlines=["Vay Du Tiec Sang Trong - Mua Ngay"],
        descriptions=["Bo suu tap moi nhat"],
    )
    low = compute_ad_relevance(
        query="vay du tiec",
        keyword_text="vay du tiec",
        headlines=["Mua Ngay Hom Nay"],
        descriptions=["Click here"],
    )
    assert high > low


def test_lp_experience_faster_load_scores_higher():
    fast = compute_lp_experience(load_ms=900, content_score=0.85)
    slow = compute_lp_experience(load_ms=3500, content_score=0.85)
    assert fast > slow


def test_lp_experience_higher_content_scores_higher():
    a = compute_lp_experience(load_ms=1500, content_score=0.95)
    b = compute_lp_experience(load_ms=1500, content_score=0.30)
    assert a > b


def test_aggregate_quality_score_in_range():
    bd = compute_quality_score(
        query="vay du tiec",
        keyword_text="vay du tiec",
        match_type="exact",
        headlines=["Vay Du Tiec Sang Trong"],
        descriptions=["Mua ngay"],
        lp_load_ms=1200,
        lp_content_score=0.85,
        advertiser_quality=0.7,
    )
    assert 1.0 <= bd.quality_score <= 10.0
    assert 1.0 <= bd.pctr_score <= 10.0
    assert 1.0 <= bd.ad_relevance <= 10.0
    assert 1.0 <= bd.lp_experience <= 10.0


def test_aggregate_better_inputs_produce_better_qs():
    good = compute_quality_score(
        query="vay du tiec",
        keyword_text="vay du tiec",
        match_type="exact",
        headlines=["Vay Du Tiec Sang Trong - Cao Cap"],
        descriptions=["Bo suu tap vay du tiec moi nhat"],
        lp_load_ms=1100,
        lp_content_score=0.92,
        advertiser_quality=0.8,
    )
    poor = compute_quality_score(
        query="vay du tiec",
        keyword_text="thoi trang chung",
        match_type="broad",
        headlines=["Mua Hang Bay Gio"],
        descriptions=["Click vao day"],
        lp_load_ms=3500,
        lp_content_score=0.30,
        advertiser_quality=-0.5,
    )
    assert good.quality_score > poor.quality_score
    assert good.pctr > poor.pctr
    assert good.ad_relevance > poor.ad_relevance
    assert good.lp_experience > poor.lp_experience
