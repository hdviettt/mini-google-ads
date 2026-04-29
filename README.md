# Mini Google Ads

### A Google Ads auction built from scratch to understand how Google really decides who wins.

A working mini version of the Google Ads stack that covers the core mechanics behind every paid search result: **the auction, Quality Score, Smart Bidding, match types**, plus an optional **Performance Max** wrapper. Type a query, watch real-time Ad Rank computation across competing advertisers, see GSP pricing decide what each one actually pays.

## The Pipeline

This is what Google does every time someone searches a commercial query. Each piece is built from scratch.

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
| **Match Expansion** | Decides which keywords match an incoming query | Exact (literal), Phrase (subsequence), Broad (semantic via embeddings) |
| **Quality Score** | Predicts ad quality from three components | Predicted CTR (logistic regression on history) + ad relevance (text similarity) + landing page experience (simulated load + content match) |
| **Ad Rank** | Ranks competing advertisers in the auction | bid × Quality Score × expected impact of assets |
| **GSP Auction** | Decides what each winner pays | Generalized Second Price: pay the minimum needed to beat the next ranker |
| **Slot Allocation** | Assigns winners to ad slots | Top-N by Ad Rank, with reserve price floor |
| **Tracking** | Logs impressions, clicks, conversions | Synthetic users with configurable click and conversion behavior |
| **Smart Bidding** | ML model that adjusts bids per query | Gradient-boosted tree predicting P(conversion \| query + user signals), targets ROAS or CPA |
| **Performance Max** *(optional)* | Multi-inventory wrapper | Same auction running across simulated channels, ML allocates budget |

## What this teaches

Most marketers (including most agency operators) hold at least one of these wrong intuitions. The simulator forces all of them to become concrete.

1. **Bid is not what you pay.** GSP charges you the minimum needed to beat the next ranker, not your bid.
2. **Higher bid does not mean higher slot.** Quality Score multiplies bid in Ad Rank. A competitor with half your bid can outrank you.
3. **Quality Score is not a vanity number.** It directly cuts your CPC. A 10/10 advertiser pays meaningfully less than a 5/10 advertiser for the same slot.
4. **Slot 1 is not always best ROI.** Slot 3 is often cheaper per conversion. The auction shows you the math.

The Smart Bidding layer adds a fifth lesson the manual auction cannot teach: **the ML eats the optimization labor**. Same query, same advertiser, different bid every time, decided by a model on conversion-probability signal. This is the layer disrupting agency Sản xuất work.

## The UI

The frontend is a **React Flow canvas** that visualizes the entire pipeline as an interactive node graph. Type a query and watch the auction run in real time across competing advertisers.

- **Left side:** Advertiser setup (campaigns, keywords, ads, Quality Score inputs)
- **Right side:** Auction pipeline (match → Quality Score → Ad Rank → GSP → slots)
- **Click any node** to see the real numbers (Ad Rank computation, GSP math, conversion logs)
- **Playground panel:** drag bid and Quality Score sliders, watch the winner change live
- **Smart Bidding view:** same query repeated across user signals, watch the model decide different bids

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, React Flow, Tailwind v4, TypeScript |
| Backend | FastAPI, Python 3.12+ |
| Database | PostgreSQL 16 + pgvector (for broad-match embeddings) |
| ML | scikit-learn (LightGBM for Smart Bidding pCVR model) |
| Embeddings | Voyage AI (voyage-3-lite, 512d) |
| Hosting | Railway |

## Project Structure

```
backend/
├── auction/         # Ad Rank computation, GSP pricing, slot allocation
├── quality_score/   # pCTR, ad relevance, LP experience
├── matching/        # broad / phrase / exact match expansion
├── bidding/         # bid strategies + Smart Bidding ML model
├── tracking/        # impression, click, conversion logging
├── simulation/      # synthetic users, queries, conversion behavior
├── api/             # FastAPI endpoints + WebSocket
├── scripts/         # CLI: seed_advertisers, train_bidding_model, run_simulation
├── db.py
├── models.py
└── main.py

frontend/
├── app/             # Next.js app router (canvas + playground + dashboard)
├── components/
│   ├── canvas/      # React Flow nodes for each pipeline stage
│   └── playground/  # control panels for live tuning
├── hooks/
└── lib/
```

## Status

Project plan: see [`PLAN.md`](PLAN.md). Currently in scoping. Phase 1 (Auction MVP) is the centerpiece and the first shippable milestone.

## Run It Yourself

Coming after Phase 1 ships. The repo currently holds plan and scaffold only.
