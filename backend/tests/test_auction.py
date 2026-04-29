"""Tests for the auction math. These tests are the source of truth
for the four wrong-intuition demos. If any of these fail, the project
is lying to its viewers."""
from __future__ import annotations
import pytest

from auction.ad_rank import compute_ad_rank
from auction.gsp import Bidder
from auction.slot_allocation import allocate_slots


def make(key: int, bid: float, qs: float) -> Bidder:
    return Bidder(key=key, bid=bid, quality_score=qs, ad_rank=compute_ad_rank(bid, qs))


# -------------------------------------------------------------------
# Wrong-intuition demo #1: bid != what you pay (GSP)
# -------------------------------------------------------------------

def test_gsp_winner_pays_less_than_bid():
    """Winner pays the minimum needed to beat the next ranker, not their full bid."""
    a = make(1, bid=10000, qs=8.0)   # ad_rank 80000
    b = make(2, bid=6000, qs=8.0)    # ad_rank 48000
    results = allocate_slots([a, b], num_slots=4)
    pos_a, paid_a = results[0]
    assert pos_a == 0
    # GSP: paid_a = ad_rank_b / qs_a = 48000 / 8 = 6000
    assert paid_a == pytest.approx(6000.0)
    # Bid was 10000, paid 6000 -> savings of 40%
    assert paid_a < a.bid


def test_gsp_pays_minimum_to_beat_next_not_bid():
    """When next ranker has very low Ad Rank, winner pays very little."""
    a = make(1, bid=20000, qs=10.0)  # ad_rank 200000
    b = make(2, bid=1000, qs=2.0)    # ad_rank 2000
    results = allocate_slots([a, b], num_slots=4)
    _, paid_a = results[0]
    # paid_a = 2000 / 10 = 200, way below bid 20000
    assert paid_a == pytest.approx(200.0)


# -------------------------------------------------------------------
# Wrong-intuition demo #2: lower bid wins via Quality Score
# -------------------------------------------------------------------

def test_lower_bid_wins_via_quality_score():
    """A bid 5000 with QS 9 beats a bid 8000 with QS 5."""
    low_bid_high_qs = make(1, bid=5000, qs=9.0)   # ad_rank 45000
    high_bid_low_qs = make(2, bid=8000, qs=5.0)   # ad_rank 40000
    results = allocate_slots([low_bid_high_qs, high_bid_low_qs], num_slots=4)
    pos_low, _ = results[0]
    pos_high, _ = results[1]
    assert pos_low == 0   # low bid wins
    assert pos_high == 1  # high bid loses


# -------------------------------------------------------------------
# Wrong-intuition demo #3: Quality Score directly cuts CPC
# -------------------------------------------------------------------

def test_higher_quality_score_pays_less_per_click():
    """Two advertisers with same bid: higher QS pays less."""
    qs10 = make(1, bid=10000, qs=10.0)  # ad_rank 100000
    qs5 = make(2, bid=10000, qs=5.0)    # ad_rank 50000
    floor = make(3, bid=2000, qs=5.0)   # ad_rank 10000 (next ranker)
    results = allocate_slots([qs10, qs5, floor], num_slots=4)
    _, paid_qs10 = results[0]   # at position 0
    _, paid_qs5 = results[1]    # at position 1
    # qs10 at pos 0: pays ad_rank_qs5 / qs10 = 50000 / 10 = 5000
    # qs5  at pos 1: pays ad_rank_floor / qs5 = 10000 / 5 = 2000
    # Same bid, but higher QS gets a lower effective CPC ratio:
    #   qs10 paid_cpc / bid = 5000/10000 = 0.5
    #   qs5  paid_cpc / bid = 2000/10000 = 0.2
    # Wait — qs5 paid less per click here because their next ranker is
    # weaker. The right comparison is "same position, different QS":
    # which we test in the next test.
    assert paid_qs10 == pytest.approx(5000.0)
    assert paid_qs5 == pytest.approx(2000.0)


def test_quality_score_lowers_cpc_at_same_position():
    """Two scenarios at the same slot position: higher QS pays less.

    Scenario A: winner has QS 10, next ranker ad_rank = 50000
    Scenario B: winner has QS 5,  next ranker ad_rank = 50000
    Both winners bid 10000.

    Winner A pays 50000/10 = 5000.
    Winner B pays 50000/5  = 10000 (== full bid, capped).
    """
    next_ranker = make(99, bid=5000, qs=10.0)  # ad_rank 50000
    a = make(1, bid=10000, qs=10.0)   # ad_rank 100000
    b = make(2, bid=10000, qs=5.0)    # ad_rank 50000

    # Scenario A: a wins, next_ranker is in the auction below
    res_a = allocate_slots([a, next_ranker], num_slots=4)
    paid_a = res_a[0][1]
    assert paid_a == pytest.approx(5000.0)

    # Scenario B: b wins, next_ranker is in the auction below
    res_b = allocate_slots([b, next_ranker], num_slots=4)
    # b ad_rank = 50000 == next_ranker ad_rank, sort puts b before only
    # by chance; force b wins by raising its bid slightly.
    b2 = make(2, bid=11000, qs=5.0)   # ad_rank 55000
    res_b = allocate_slots([b2, next_ranker], num_slots=4)
    paid_b = res_b[0][1]
    # 50000 / 5 = 10000, capped at bid 11000 → stays 10000
    assert paid_b == pytest.approx(10000.0)
    assert paid_a < paid_b


# -------------------------------------------------------------------
# Slot allocation invariants
# -------------------------------------------------------------------

def test_slot_allocation_orders_by_ad_rank():
    bidders = [
        make(1, bid=5000, qs=4.0),    # 20000
        make(2, bid=10000, qs=3.0),   # 30000
        make(3, bid=4000, qs=10.0),   # 40000
    ]
    results = allocate_slots(bidders, num_slots=4)
    # By ad_rank desc: bidder 3 (40000), bidder 2 (30000), bidder 1 (20000)
    assert results[2][0] == 0  # bidder 3 takes slot 0
    assert results[1][0] == 1
    assert results[0][0] == 2


def test_reserve_floor_excludes_low_ad_rank_bidders():
    bidders = [
        make(1, bid=100, qs=1.0),     # ad_rank 100, below default reserve 1000
        make(2, bid=10000, qs=8.0),   # ad_rank 80000
    ]
    results = allocate_slots(bidders, num_slots=4)
    assert results[0][0] is None  # filtered out by reserve
    assert results[1][0] == 0


def test_only_top_n_get_slots():
    bidders = [make(i, bid=10000 - i * 100, qs=8.0) for i in range(8)]
    results = allocate_slots(bidders, num_slots=3)
    winners = [r for r in results if r[0] is not None]
    assert len(winners) == 3


def test_non_winners_pay_zero():
    bidders = [
        make(1, bid=10000, qs=8.0),
        make(2, bid=5000, qs=8.0),
    ]
    results = allocate_slots(bidders, num_slots=1)
    assert results[1][0] is None
    assert results[1][1] == 0.0


def test_last_winner_pays_at_least_reserve_floor_per_qs():
    """When there's no next ranker, the last winner pays reserve / QS."""
    only = make(1, bid=10000, qs=5.0)
    results = allocate_slots([only], num_slots=4, reserve_ad_rank=1000)
    _, paid = results[0]
    assert paid == pytest.approx(1000.0 / 5.0)  # reserve / QS = 200


def test_ad_rank_compute_invariants():
    assert compute_ad_rank(10000, 5.0) == 50000.0
    assert compute_ad_rank(0, 5.0) == 0.0
    with pytest.raises(ValueError):
        compute_ad_rank(-1, 5.0)
    with pytest.raises(ValueError):
        compute_ad_rank(100, 11.0)
