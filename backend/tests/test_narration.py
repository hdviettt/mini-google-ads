"""Tests for narration. The template version must always return a string,
even in the lower-bid-wins-via-QS branch (regression for a None.replace
crash that bit during local testing)."""
from models import AdRankLine
from narration.template import narrate_auction


def line(advertiser_id, name, bid, qs, ad_rank, slot=None, paid=None):
    return AdRankLine(
        advertiser_id=advertiser_id,
        advertiser_name=name,
        campaign_id=advertiser_id,
        keyword_id=advertiser_id,
        keyword_text="vay du tiec",
        match_type="exact",
        ad_id=advertiser_id,
        ad_headline=f"{name} Ad",
        bid=bid,
        quality_score=qs,
        pctr=0.05,
        ad_relevance=7.0,
        lp_experience=7.0,
        ad_rank=ad_rank,
        slot_position=slot,
        paid_cpc=paid,
    )


def test_narration_lower_bid_wins_via_qs_returns_string():
    """Regression: top.bid < runner_up.bid branch used to crash with
    AttributeError on None.replace because parts.append() returned None."""
    lines = [
        line(1, "A", bid=5000, qs=10.0, ad_rank=50000, slot=0, paid=4000),
        line(2, "B", bid=8000, qs=5.0, ad_rank=40000, slot=1, paid=2000),
    ]
    out = narrate_auction("vay du tiec", lines)
    assert isinstance(out, str)
    assert "Quality Score" in out
    assert "A" in out and "B" in out


def test_narration_higher_bid_wins_returns_string():
    lines = [
        line(1, "A", bid=10000, qs=8.0, ad_rank=80000, slot=0, paid=5000),
        line(2, "B", bid=6000, qs=8.0, ad_rank=48000, slot=1, paid=2000),
    ]
    out = narrate_auction("vay du tiec", lines)
    assert isinstance(out, str)
    assert "A" in out


def test_narration_no_winners():
    out = narrate_auction("nothing matches", [])
    assert isinstance(out, str)
    assert len(out) > 0


def test_narration_includes_gsp_savings_callout():
    lines = [
        line(1, "A", bid=10000, qs=10.0, ad_rank=100000, slot=0, paid=5000),
        line(2, "B", bid=6000, qs=8.0, ad_rank=48000, slot=1, paid=2000),
    ]
    out = narrate_auction("vay du tiec", lines)
    assert "GSP" in out or "tiet kiem" in out or "khong phai" in out
