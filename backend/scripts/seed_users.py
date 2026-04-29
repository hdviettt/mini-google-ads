"""Seed 500 synthetic users with intent profiles, geo, device.
Idempotent: skips if users already exist."""
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import get_connection


INTENT_DIST = [("low", 0.4), ("medium", 0.4), ("high", 0.2)]
GEO_DIST = [("HCM", 0.45), ("HN", 0.35), ("DN", 0.10), ("CT", 0.05), ("HP", 0.05)]
DEVICE_DIST = [("mobile", 0.75), ("desktop", 0.25)]


def weighted_pick(dist: list[tuple[str, float]]) -> str:
    r = random.random()
    cum = 0.0
    for value, weight in dist:
        cum += weight
        if r <= cum:
            return value
    return dist[-1][0]


def seed(n: int = 500, seed_value: int = 42):
    random.seed(seed_value)
    with get_connection() as conn:
        existing = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if existing >= n:
            print(f"users table already has {existing} rows, skipping")
            return
        rows = []
        for _ in range(n - existing):
            rows.append((
                weighted_pick(INTENT_DIST),
                weighted_pick(GEO_DIST),
                weighted_pick(DEVICE_DIST),
            ))
        conn.cursor().executemany(
            "INSERT INTO users (intent_level, geo, device) VALUES (%s, %s, %s)",
            rows,
        )
        conn.commit()
    print(f"seeded {len(rows)} users")


if __name__ == "__main__":
    seed()
