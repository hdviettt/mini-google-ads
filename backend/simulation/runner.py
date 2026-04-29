"""Run a batch of synthetic queries through the auction and log
impressions / clicks / conversions. This produces the training data
for Smart Bidding (Phase 4) and is also the stress-test for the
auction pipeline.

For each iteration:
  1. Pick a random user
  2. Pick a query (from a fixed query pool)
  3. Run the auction
  4. For each winning ad: roll click? if click, roll convert?
  5. Log impression, click, conversion rows."""
from __future__ import annotations
import random
from dataclasses import dataclass

from auction.engine import run_auction
from tracking.events import log_impression, log_click, log_conversion
from simulation.behavior import (
    click_probability,
    conversion_probability,
    conversion_value,
)


# Query pool for the simulation. Mix of head + tail queries across
# the three verticals seeded by scripts/seed_advertisers.py.
QUERY_POOL = [
    # Apparel
    "vay du tiec",
    "vay du tiec gia re",
    "vay du tiec sang trong",
    "vay du tiec cao cap",
    "dam du tiec",
    "vay maxi",
    "ao thun nu",
    "ao so mi nu",
    "thoi trang nu",
    "set bo nu",
    # Finance
    "vay tien online",
    "vay tien nhanh",
    "vay tien khong the chap",
    "vay tieu dung",
    "app vay tien",
    "vay the tin dung",
    "vay mua nha",
    "vay mua xe",
    # Travel
    "ve may bay gia re",
    "dat ve may bay",
    "ve may bay khuyen mai",
    "dat phong khach san",
    "khach san da nang",
    "tour du lich",
    "tour phu quoc",
    "tour da lat",
    "resort phu quoc",
]


@dataclass
class SimulationResult:
    queries: int
    impressions: int
    clicks: int
    conversions: int
    total_revenue_vnd: float
    total_spend_vnd: float


def run_simulation(
    conn,
    n_queries: int,
    seed: int = 42,
    queries: list[str] | None = None,
) -> SimulationResult:
    rng = random.Random(seed)
    pool = queries or QUERY_POOL

    user_rows = conn.execute("SELECT id, intent_level FROM users").fetchall()
    if not user_rows:
        raise RuntimeError("no users seeded; run scripts/seed_users.py first")
    users = [(r[0], r[1]) for r in user_rows]

    advertisers = {
        r[0]: r[1]
        for r in conn.execute("SELECT id, vertical FROM advertisers").fetchall()
    }

    impressions = clicks = conversions = 0
    revenue = spend = 0.0

    for _ in range(n_queries):
        user_id, intent = rng.choice(users)
        query = rng.choice(pool)

        # Persist a single connection's worth: open new conn so commits
        # land per query (avoids long transactions during long sims)
        result = run_auction(conn, query=query, user_id=user_id, num_slots=4, persist=True)

        for line in result.lines:
            if line.slot_position is None or line.paid_cpc is None:
                continue

            impression_id = log_impression(
                conn,
                auction_id=result.auction_id,
                advertiser_id=line.advertiser_id,
                ad_id=line.ad_id,
                slot_position=line.slot_position,
                paid_cpc=line.paid_cpc,
            )
            impressions += 1

            ctr = click_probability(
                quality_score=line.quality_score,
                slot_position=line.slot_position,
                match_type=line.match_type,
                intent_level=intent,
            )
            if rng.random() < ctr:
                click_id = log_click(conn, impression_id)
                clicks += 1
                spend += float(line.paid_cpc)

                vertical = advertisers.get(line.advertiser_id, "apparel")
                cvr = conversion_probability(
                    quality_score=line.quality_score,
                    intent_level=intent,
                    vertical=vertical,
                )
                if rng.random() < cvr:
                    value = conversion_value(vertical, rng)
                    log_conversion(conn, click_id, value)
                    conversions += 1
                    revenue += value

        # Commit every 25 queries to keep transactions short
        if impressions and impressions % 100 == 0:
            conn.commit()

    conn.commit()
    return SimulationResult(
        queries=n_queries,
        impressions=impressions,
        clicks=clicks,
        conversions=conversions,
        total_revenue_vnd=revenue,
        total_spend_vnd=spend,
    )
