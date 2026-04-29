# Mini Google Ads

### A Google Ads auction built from scratch to understand how Google really decides who wins.

A working mini version of the Google Ads stack covering the core mechanics behind every paid search result: **the auction, Quality Score, Smart Bidding, match types**, plus narration that explains every outcome in plain Vietnamese. Type a query, watch real-time Ad Rank computation across competing advertisers, see GSP pricing decide what each one actually pays.

## The Pipeline

```
                ADVERTISER SIDE (setup)                              USER SIDE (auction)
        ┌────────────────────────────────────────┐        ┌──────────────────────────────────────────────┐
        │                                        │        │                                              │
        │   Campaign ──→ Keywords ──┬──→ Match    │        │   User Query                                 │
        │   (budget,    (bid,       │   Expansion │        │       │                                      │
        │    KPI,        match      │   (broad,   │        │       ├──→ Match Lookup ──→ Eligible Ads     │
        │    audience)   type)      │    phrase,  │        │       │           │                         │
        │                          │    exact)   │        │       │           ▼                         │
        │                          └──→ Quality   │        │       │     Quality Score                   │
        │                              Score      │        │       │   (pCTR + ad rel + LP)              │
        │                              Inputs     │        │       │           │                         │
        │                                         │        │       │           ▼                         │
        │   ┌──────────┐ ┌──────────┐ ┌─────────┐ │        │       │      Ad Rank Calc                   │
        │   │ Campaign │ │ Quality  │ │ History │ │◄───────┤       │   (bid × QS × asset)                │
        │   │  Store   │ │  Signals │ │  Logs   │ │        │       │           │                         │
        │   └──────────┘ └──────────┘ └─────────┘ │        │       │           ▼                         │
        │                                         │        │       │      GSP Auction                    │
        │              Smart Bidding ML           │        │       │   (pay min to beat next)            │
        │   ┌──────────────────────────────┐      │        │       │           │                         │
        │   │  Predict P(conversion|query, │ ─────┼────────┤       └──→ Slot Allocation ──→ Impression  │
        │   │   user signals) → bid adjust │      │        │                       │                     │
        │   └──────────────────────────────┘      │        │                Click / Convert              │
        │                  ▲                      │        │                       │                     │
        └──────────────────┼──────────────────────┘        └───────────────────────┼─────────────────────┘
                           │                                                       │
                           └────────── Conversion data feeds back ─────────────────┘
```

### What each piece does

| Stage | What it does | How |
|-------|-------------|-----|
| **Campaign Builder** | Lets advertisers register campaigns with budget, keywords, ads, audiences | Web UI, persists to Postgres |
| **Match Expansion** | Decides which keywords match an incoming query | Exact (literal), Phrase (subsequence), Broad (semantic via local sentence-transformer embeddings) |
| **Quality Score** | Predicts ad quality from three components | Predicted CTR (logistic on token coverage + match type) + ad relevance (text similarity) + landing page experience (simulated load + content match) |
| **Ad Rank** | Ranks competing advertisers in the auction | bid × Quality Score × expected impact of assets |
| **GSP Auction** | Decides what each winner pays | Generalized Second Price: pay the minimum needed to beat the next ranker |
| **Slot Allocation** | Assigns winners to ad slots | Top-N by Ad Rank, with reserve price floor |
| **Tracking** | Logs impressions, clicks, conversions | Synthetic users with configurable click and conversion behavior |
| **Smart Bidding** | ML model that adjusts bids per query | LightGBM predicting P(conversion \| query + user signals), targets ROAS or CPA |
| **Narration** | Translates the math into plain-language explanations | Template-based Vietnamese, with optional Groq + Llama 3.3 70B upgrade |

## What this teaches

Most marketers (including most agency operators) hold at least one of these wrong intuitions. The simulator forces all of them to become concrete.

1. **Bid is not what you pay.** GSP charges you the minimum needed to beat the next ranker, not your bid.
2. **Higher bid does not mean higher slot.** Quality Score multiplies bid in Ad Rank. A competitor with half your bid can outrank you.
3. **Quality Score is not a vanity number.** It directly cuts your CPC. A 10/10 advertiser pays meaningfully less than a 5/10 advertiser for the same slot.
4. **Slot 1 is not always best ROI.** Slot 3 is often cheaper per conversion. The auction shows you the math.

The Smart Bidding layer adds a fifth lesson the manual auction cannot teach: **the ML eats the optimization labor**. Same query, same advertiser, different bid every time, decided by a model on conversion-probability signal.

## The UI

The frontend is a **React Flow canvas** that visualizes the auction running in real time across competing advertisers.

- **Left side:** Advertiser setup (campaigns, keywords, ads, Quality Score inputs)
- **Right side:** Auction pipeline (match → Quality Score → Ad Rank → GSP → slots)
- **Click any node** to see Ad Rank computation, GSP math, conversion logs
- **Playground panel:** drag bid and Quality Score sliders, watch the winner change live
- **User intent picker:** anonymous / high / medium / low intent. Same query, different signal, different Smart Bidding bid.
- **Simulation panel:** fire 500 synthetic queries, watch CTR / CVR / ROAS materialize.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, React Flow, Tailwind v4, TypeScript |
| Backend | FastAPI, Python 3.12+ |
| Database | PostgreSQL 16 + pgvector |
| ML | scikit-learn + LightGBM (Smart Bidding pCVR model) |
| Embeddings | Local sentence-transformers (`all-MiniLM-L6-v2`, CPU, no API key) |
| LLM Narration | Groq (Llama 3.3 70B) - optional, falls back to template |
| Hosting | Railway |

## Project Structure

```
backend/
├── auction/         # Ad Rank, GSP, slot allocation
├── quality_score/   # pCTR, ad relevance, LP experience, aggregate
├── matching/        # exact, phrase, broad (semantic), dispatcher, embedder
├── bidding/         # features, LightGBM pCVR model, strategies
├── tracking/        # impression, click, conversion logging
├── simulation/      # synthetic users, queries, conversion behavior
├── narration/       # template + Groq LLM explanations
├── api/             # FastAPI endpoints (health, advertisers, keywords, auction, simulation)
├── scripts/         # seed_advertisers, seed_users, embed_keywords, run_simulation, train_bidding_model
├── tests/           # 33 tests, pytest
├── db.py
├── models.py
└── main.py

frontend/
├── app/             # Next.js app router
├── components/
│   ├── canvas/      # PipelineCanvas, AdvertiserNode, StageNode
│   ├── panels/      # DetailPanel, SimulationPanel
│   └── playground/  # Bid + QS sliders
└── lib/             # typed API client
```

## Run It Yourself

### Prerequisites
- Python 3.12+
- Node.js 20+
- Docker (for Postgres) or your own Postgres 16 + pgvector

### Backend

```bash
cd backend

# Local Postgres via docker-compose (from project root)
cd .. && docker compose up -d postgres && cd backend

# Python deps (no Voyage / OpenAI key required)
pip install -e .

# Initialize schema + seed
python db.py
python scripts/seed_advertisers.py
python scripts/seed_users.py
python scripts/embed_keywords.py        # ~10s on CPU, embeds ~80 keywords

# Start API
cp .env.example .env                     # fill in GROQ_API_KEY if you want LLM narration
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000), type a query like `vay du tiec` or `vay tien online`, watch the auction.

### Train Smart Bidding (optional)

```bash
cd backend
python scripts/run_simulation.py --n 1000      # generate logged events
python scripts/train_bidding_model.py          # fit LightGBM
```

After training, advertisers with `target_roas` / `target_cpa` / `maximize_conversions` strategies will use the model's pCVR predictions to decide bids per query.

## Deploy to Railway

```bash
# From project root, log in to Railway
railway login

# Provision: new project + Postgres
railway init
railway add postgresql

# Deploy backend (Dockerfile picked up automatically)
cd backend
railway up

# Deploy frontend
cd ../frontend
NEXT_PUBLIC_API_BASE=https://YOUR-BACKEND.up.railway.app railway up
```

The backend's `startup` hook runs `init_db()` automatically. To populate the database on first boot, set `AUTO_SEED=1` and `AUTO_EMBED=1` env vars on the backend service.

Optional: wire `ads.hoangducviet.work` to the frontend service in Railway → Domains.

## Status

All 4 phases are shipped. 33 tests pass. The four wrong-intuition demos all work on the canvas:

1. Bid 10k, pay 6k (GSP). Visible in DetailPanel as "GSP saving" callout.
2. Lower bid wins via Quality Score multiplier. Visible in Ad Rank ordering.
3. Quality Score 10 vs 5 cuts CPC for the same slot. Drag QS slider to see.
4. Slot 3 cheaper per conversion than slot 1. Visible per-slot in the canvas.

See [`PLAN.md`](PLAN.md) for phase-by-phase details. See [`CLAUDE.md`](CLAUDE.md) for project rules.

## License

MIT.
