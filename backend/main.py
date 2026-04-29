from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


# Phase 1+ routers (registered when their phase ships)
try:
    from api.auction import router as auction_router
    app.include_router(auction_router)
except Exception:
    pass

try:
    from api.simulation import router as simulation_router
    app.include_router(simulation_router)
except Exception:
    pass


@app.get("/")
def root() -> dict:
    return {
        "name": "mini-google-ads",
        "version": "0.1.0",
        "endpoints": ["/health", "/advertisers", "/keywords", "/auction/run", "/simulate"],
    }
