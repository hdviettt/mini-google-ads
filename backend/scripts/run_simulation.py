"""Run a synthetic simulation: generate N queries, run them through
the auction, log impressions/clicks/conversions. Prints summary stats.

Usage:
    python scripts/run_simulation.py --n 1000
    python scripts/run_simulation.py --n 5000 --seed 7"""
from __future__ import annotations
import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import get_connection
from simulation.runner import run_simulation


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=500)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    started = time.time()
    with get_connection() as conn:
        result = run_simulation(conn, n_queries=args.n, seed=args.seed)
    elapsed = time.time() - started

    print(f"queries:     {result.queries:>8,}")
    print(f"impressions: {result.impressions:>8,}")
    print(f"clicks:      {result.clicks:>8,}")
    print(f"conversions: {result.conversions:>8,}")
    if result.impressions:
        ctr = 100.0 * result.clicks / result.impressions
        print(f"CTR:         {ctr:>7.2f}%")
    if result.clicks:
        cvr = 100.0 * result.conversions / result.clicks
        print(f"CVR:         {cvr:>7.2f}%")
    print(f"spend:       {int(result.total_spend_vnd):>12,} VND")
    print(f"revenue:     {int(result.total_revenue_vnd):>12,} VND")
    if result.total_spend_vnd > 0:
        print(f"ROAS:        {result.total_revenue_vnd / result.total_spend_vnd:>7.2f}x")
    print(f"elapsed:     {elapsed:.1f}s")


if __name__ == "__main__":
    main()
