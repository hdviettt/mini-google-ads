import psycopg
from config import DATABASE_URL, EMBEDDING_DIM

SCHEMA_SQL = f"""
CREATE EXTENSION IF NOT EXISTS vector;

-- Advertiser identity and budget
CREATE TABLE IF NOT EXISTS advertisers (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    vertical     TEXT NOT NULL,
    daily_budget NUMERIC(12, 2) NOT NULL DEFAULT 1000000.00,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One campaign per advertiser for now (can be extended later).
CREATE TABLE IF NOT EXISTS campaigns (
    id             SERIAL PRIMARY KEY,
    advertiser_id  INTEGER NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    bid_strategy   TEXT NOT NULL DEFAULT 'manual_cpc',  -- manual_cpc | maximize_conversions | target_roas | target_cpa
    target_roas    NUMERIC(8, 4),
    target_cpa     NUMERIC(12, 2),
    daily_budget   NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keywords (
    id           SERIAL PRIMARY KEY,
    campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    match_type   TEXT NOT NULL DEFAULT 'exact',  -- exact | phrase | broad
    max_cpc_bid  NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    embedding    vector({EMBEDDING_DIM}),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- An ad is a bundle of headlines and descriptions (RSA-style).
CREATE TABLE IF NOT EXISTS ads (
    id           SERIAL PRIMARY KEY,
    campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    headlines    JSONB NOT NULL DEFAULT '[]'::jsonb,
    descriptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    final_url    TEXT NOT NULL,
    lp_load_ms   INTEGER NOT NULL DEFAULT 1500,
    lp_content_score NUMERIC(4, 2) NOT NULL DEFAULT 0.50,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Synthetic users with intent profiles.
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    intent_level  TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high
    geo           TEXT NOT NULL DEFAULT 'HCM',
    device        TEXT NOT NULL DEFAULT 'mobile',  -- mobile | desktop
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query log: every search a synthetic user makes.
CREATE TABLE IF NOT EXISTS queries (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    text        TEXT NOT NULL,
    embedding   vector({EMBEDDING_DIM}),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per auction run.
CREATE TABLE IF NOT EXISTS auctions (
    id          SERIAL PRIMARY KEY,
    query_id    INTEGER NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-advertiser line in an auction with computed Ad Rank.
CREATE TABLE IF NOT EXISTS ad_rank_results (
    id              SERIAL PRIMARY KEY,
    auction_id      INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    advertiser_id   INTEGER NOT NULL REFERENCES advertisers(id),
    keyword_id      INTEGER NOT NULL REFERENCES keywords(id),
    ad_id           INTEGER NOT NULL REFERENCES ads(id),
    match_type      TEXT NOT NULL,
    bid             NUMERIC(12, 2) NOT NULL,
    quality_score   NUMERIC(4, 2) NOT NULL,
    pctr            NUMERIC(6, 4) NOT NULL DEFAULT 0,
    ad_relevance    NUMERIC(4, 2) NOT NULL DEFAULT 0,
    lp_experience   NUMERIC(4, 2) NOT NULL DEFAULT 0,
    ad_rank         NUMERIC(12, 4) NOT NULL,
    slot_position   INTEGER,                        -- NULL if not winning a slot
    paid_cpc        NUMERIC(12, 2)                  -- NULL if no slot
);

-- Event tables. Append-only logs that feed Smart Bidding training (Phase 4).
CREATE TABLE IF NOT EXISTS impressions (
    id            SERIAL PRIMARY KEY,
    auction_id    INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    advertiser_id INTEGER NOT NULL REFERENCES advertisers(id),
    ad_id         INTEGER NOT NULL REFERENCES ads(id),
    slot_position INTEGER NOT NULL,
    paid_cpc      NUMERIC(12, 2) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clicks (
    id             SERIAL PRIMARY KEY,
    impression_id  INTEGER NOT NULL REFERENCES impressions(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversions (
    id          SERIAL PRIMARY KEY,
    click_id    INTEGER NOT NULL REFERENCES clicks(id) ON DELETE CASCADE,
    value_vnd   NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_keywords_campaign ON keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_keywords_text ON keywords(text);
CREATE INDEX IF NOT EXISTS idx_ads_campaign ON ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_rank_results_auction ON ad_rank_results(auction_id);
CREATE INDEX IF NOT EXISTS idx_impressions_auction ON impressions(auction_id);
CREATE INDEX IF NOT EXISTS idx_clicks_impression ON clicks(impression_id);
CREATE INDEX IF NOT EXISTS idx_conversions_click ON conversions(click_id);
CREATE INDEX IF NOT EXISTS idx_queries_created ON queries(created_at);
"""


def get_connection() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL)


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(SCHEMA_SQL)
        conn.commit()
    print("Database schema initialized.")


if __name__ == "__main__":
    init_db()
