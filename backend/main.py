import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from api.health import router as health_router
from api.advertisers import router as advertisers_router
from api.keywords import router as keywords_router

app = FastAPI(title="mini-google-ads", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ads.hoangducviet.work",
    ],
    allow_origin_regex=r"https://.*\.(up\.railway\.app|hoangducviet\.work)",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(advertisers_router)
app.include_router(keywords_router)

# Phase 1+ routers
try:
    from api.auction import router as auction_router
    app.include_router(auction_router)
except Exception as e:
    print(f"auction router not loaded: {e}", file=sys.stderr)

# Phase 4 router
try:
    from api.simulation import router as simulation_router
    app.include_router(simulation_router)
except Exception as e:
    print(f"simulation router not loaded: {e}", file=sys.stderr)


@app.on_event("startup")
def startup() -> None:
    """First-boot initialization. Idempotent: safe to run on every start.
    Behavior controlled by env vars:
      AUTO_INIT_DB=1     (default) creates schema if missing
      AUTO_SEED=1        (default off in prod) seeds advertisers + users
      AUTO_EMBED=1       (default off in prod) embeds keywords once
    """
    if os.environ.get("AUTO_INIT_DB", "1") == "1":
        try:
            init_db()
        except Exception as e:
            print(f"init_db failed at startup: {e}", file=sys.stderr)

    if os.environ.get("AUTO_SEED", "0") == "1":
        try:
            sys.path.insert(0, str(Path(__file__).parent / "scripts"))
            from scripts.seed_advertisers import seed as seed_advertisers
            from scripts.seed_users import seed as seed_users
            seed_advertisers()
            seed_users()
        except Exception as e:
            print(f"auto-seed failed: {e}", file=sys.stderr)

    if os.environ.get("AUTO_EMBED", "0") == "1":
        try:
            from scripts.embed_keywords import run as embed_run
            embed_run(force=False)
        except Exception as e:
            print(f"auto-embed failed: {e}", file=sys.stderr)


@app.get("/")
def root() -> dict:
    return {
        "name": "mini-google-ads",
        "version": "0.1.0",
        "endpoints": ["/health", "/advertisers", "/keywords", "/auction/run", "/simulate/run", "/simulate/stats"],
    }
