"""Train the LightGBM pCVR model on the impressions / clicks /
conversions logged by run_simulation.py.

Pulls every impression, joins to clicks and conversions, builds the
feature matrix, and fits a binary classifier predicting "did this
impression eventually convert?".

Usage:
    python scripts/train_bidding_model.py
    python scripts/train_bidding_model.py --min-rows 200"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import get_connection
from bidding.features import extract_features
from bidding.pcvr_model import train


SQL = """
SELECT
    ar.quality_score, ar.pctr, ar.ad_relevance, ar.lp_experience,
    ar.match_type, ar.slot_position,
    a.vertical,
    u.intent_level, u.device, u.geo,
    CASE WHEN cv.id IS NOT NULL THEN 1 ELSE 0 END AS converted
FROM impressions imp
JOIN ad_rank_results ar
  ON ar.auction_id = imp.auction_id AND ar.advertiser_id = imp.advertiser_id
JOIN advertisers a ON a.id = imp.advertiser_id
JOIN auctions au ON au.id = imp.auction_id
JOIN queries q ON q.id = au.query_id
LEFT JOIN users u ON u.id = q.user_id
LEFT JOIN clicks cl ON cl.impression_id = imp.id
LEFT JOIN conversions cv ON cv.click_id = cl.id
WHERE imp.slot_position IS NOT NULL
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--min-rows", type=int, default=200,
                        help="abort if fewer than this many impressions exist")
    args = parser.parse_args()

    with get_connection() as conn:
        rows = conn.execute(SQL).fetchall()

    if len(rows) < args.min_rows:
        print(f"only {len(rows)} impressions found, need >= {args.min_rows}")
        print("run scripts/run_simulation.py first")
        sys.exit(1)

    feature_rows = []
    labels = []
    for r in rows:
        (qs, pctr, ad_rel, lp, match_type, slot_pos, vertical,
         intent_level, device, geo, converted) = r
        feature_rows.append(extract_features(
            quality_score=float(qs),
            pctr=float(pctr),
            ad_relevance=float(ad_rel),
            lp_experience=float(lp),
            slot_position=int(slot_pos),
            match_type=match_type or "exact",
            intent_level=intent_level or "medium",
            device=device or "mobile",
            geo=geo or "HCM",
            vertical=vertical or "apparel",
        ))
        labels.append(int(converted))

    print(f"training on {len(feature_rows)} impressions ({sum(labels)} positive)...")
    meta = train(feature_rows, labels)
    print(f"trained. n_train={meta['n_train']}, pos={meta['n_pos']}, neg={meta['n_neg']}")
    print("model saved to backend/bidding/_model.txt")


if __name__ == "__main__":
    main()
