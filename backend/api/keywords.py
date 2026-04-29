from fastapi import APIRouter
from db import get_connection

router = APIRouter(prefix="/keywords", tags=["keywords"])


@router.get("")
def list_keywords(limit: int = 200, offset: int = 0) -> dict:
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM keywords").fetchone()[0]
        rows = conn.execute(
            """
            SELECT k.id, k.text, k.match_type, k.max_cpc_bid,
                   c.id AS campaign_id, a.id AS advertiser_id, a.name AS advertiser_name
            FROM keywords k
            JOIN campaigns c ON c.id = k.campaign_id
            JOIN advertisers a ON a.id = c.advertiser_id
            ORDER BY k.id
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        ).fetchall()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": r[0],
                "text": r[1],
                "match_type": r[2],
                "max_cpc_bid": float(r[3]),
                "campaign_id": r[4],
                "advertiser_id": r[5],
                "advertiser_name": r[6],
            }
            for r in rows
        ],
    }
