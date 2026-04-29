from fastapi import APIRouter, HTTPException
from db import get_connection

router = APIRouter(prefix="/advertisers", tags=["advertisers"])


@router.get("")
def list_advertisers() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.vertical, a.daily_budget,
                   c.id AS campaign_id, c.name AS campaign_name, c.bid_strategy,
                   c.target_roas, c.target_cpa, c.daily_budget AS campaign_budget,
                   COUNT(DISTINCT k.id) AS keyword_count,
                   COUNT(DISTINCT ad.id) AS ad_count
            FROM advertisers a
            LEFT JOIN campaigns c ON c.advertiser_id = a.id
            LEFT JOIN keywords k ON k.campaign_id = c.id
            LEFT JOIN ads ad ON ad.campaign_id = c.id
            GROUP BY a.id, c.id
            ORDER BY a.id
            """
        ).fetchall()

    out = []
    for r in rows:
        out.append({
            "id": r[0],
            "name": r[1],
            "vertical": r[2],
            "daily_budget": float(r[3]),
            "campaign": {
                "id": r[4],
                "name": r[5],
                "bid_strategy": r[6],
                "target_roas": float(r[7]) if r[7] is not None else None,
                "target_cpa": float(r[8]) if r[8] is not None else None,
                "daily_budget": float(r[9]) if r[9] is not None else None,
            } if r[4] is not None else None,
            "keyword_count": r[10],
            "ad_count": r[11],
        })
    return out


@router.get("/{advertiser_id}")
def get_advertiser(advertiser_id: int) -> dict:
    with get_connection() as conn:
        adv = conn.execute(
            "SELECT id, name, vertical, daily_budget FROM advertisers WHERE id = %s",
            (advertiser_id,),
        ).fetchone()
        if not adv:
            raise HTTPException(status_code=404, detail="advertiser not found")
        keywords = conn.execute(
            """
            SELECT k.id, k.text, k.match_type, k.max_cpc_bid
            FROM keywords k JOIN campaigns c ON c.id = k.campaign_id
            WHERE c.advertiser_id = %s ORDER BY k.id
            """,
            (advertiser_id,),
        ).fetchall()
        ads = conn.execute(
            """
            SELECT ad.id, ad.headlines, ad.descriptions, ad.final_url, ad.lp_load_ms, ad.lp_content_score
            FROM ads ad JOIN campaigns c ON c.id = ad.campaign_id
            WHERE c.advertiser_id = %s ORDER BY ad.id
            """,
            (advertiser_id,),
        ).fetchall()

    return {
        "id": adv[0],
        "name": adv[1],
        "vertical": adv[2],
        "daily_budget": float(adv[3]),
        "keywords": [
            {"id": k[0], "text": k[1], "match_type": k[2], "max_cpc_bid": float(k[3])}
            for k in keywords
        ],
        "ads": [
            {
                "id": a[0],
                "headlines": a[1],
                "descriptions": a[2],
                "final_url": a[3],
                "lp_load_ms": a[4],
                "lp_content_score": float(a[5]),
            }
            for a in ads
        ],
    }
