"""Phase 1 Quality Score: deterministic per-advertiser baseline so
the auction is interesting without yet computing real signals.
Phase 2 replaces this with pCTR + ad relevance + LP experience."""
from __future__ import annotations


# Hand-tuned baseline QS per seeded advertiser id. Kept varied so the
# Phase 1 demo shows that lower bids can win on quality.
# Falls back to a hash-based value for non-seeded advertisers.
SEED_BASELINE_QS = {
    1: 8.5,   # BrandX Fashion - clean LP, premium copy
    2: 5.5,   # Coco Style - cheaper LP, plainer copy
    3: 9.5,   # Luxe Boutique - polished
    4: 7.5,   # Tien Vay Nhanh
    5: 6.0,   # Smart Loans
    6: 9.0,   # Tin Tin Capital
    7: 7.5,   # Sky Travel
    8: 7.0,   # Booking VN
    9: 6.5,   # Mua Tour
    10: 5.0,  # VN Hotels Direct
}


def baseline_quality_score(advertiser_id: int) -> float:
    """Return Quality Score in [1, 10]."""
    if advertiser_id in SEED_BASELINE_QS:
        return SEED_BASELINE_QS[advertiser_id]
    # Stable fallback in [4.0, 8.0]
    return 4.0 + ((advertiser_id * 1103515245 + 12345) & 0xFF) / 255.0 * 4.0
