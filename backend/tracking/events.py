"""Append-only event logging for impressions, clicks, conversions.

This is the only place that writes to those tables. Smart Bidding's
training data comes straight from these logs, so the schema is the
contract."""
from __future__ import annotations


def log_impression(
    conn,
    auction_id: int,
    advertiser_id: int,
    ad_id: int,
    slot_position: int,
    paid_cpc: float,
) -> int:
    return conn.execute(
        """
        INSERT INTO impressions (auction_id, advertiser_id, ad_id, slot_position, paid_cpc)
        VALUES (%s, %s, %s, %s, %s) RETURNING id
        """,
        (auction_id, advertiser_id, ad_id, slot_position, paid_cpc),
    ).fetchone()[0]


def log_click(conn, impression_id: int) -> int:
    return conn.execute(
        "INSERT INTO clicks (impression_id) VALUES (%s) RETURNING id",
        (impression_id,),
    ).fetchone()[0]


def log_conversion(conn, click_id: int, value_vnd: float) -> int:
    return conn.execute(
        "INSERT INTO conversions (click_id, value_vnd) VALUES (%s, %s) RETURNING id",
        (click_id, value_vnd),
    ).fetchone()[0]
