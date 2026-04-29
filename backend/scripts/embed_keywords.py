"""Embed every keyword in the database with sentence-transformers and
write to keywords.embedding. Run once after seeding, or any time new
keywords are added.

Usage:
    python scripts/embed_keywords.py
    python scripts/embed_keywords.py --force   # re-embed all keywords"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import get_connection
from matching.embedder import embed_texts


def run(force: bool = False, batch_size: int = 64) -> None:
    with get_connection() as conn:
        if force:
            rows = conn.execute(
                "SELECT id, text FROM keywords ORDER BY id",
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, text FROM keywords WHERE embedding IS NULL ORDER BY id",
            ).fetchall()

        if not rows:
            print("nothing to embed")
            return

        print(f"embedding {len(rows)} keywords with all-MiniLM-L6-v2...")
        ids = [r[0] for r in rows]
        texts = [r[1] for r in rows]

        for start in range(0, len(texts), batch_size):
            chunk_ids = ids[start:start + batch_size]
            chunk_texts = texts[start:start + batch_size]
            vecs = embed_texts(chunk_texts)
            for kid, vec in zip(chunk_ids, vecs):
                conn.execute(
                    "UPDATE keywords SET embedding = %s::vector WHERE id = %s",
                    (vec, kid),
                )
            conn.commit()
            print(f"  {min(start + batch_size, len(texts))}/{len(texts)}")
    print("done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-embed even if embedding is set")
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()
    run(force=args.force, batch_size=args.batch_size)
