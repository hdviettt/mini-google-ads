# mini-google-ads

A working from-scratch mini Google Ads stack. Centerpiece is the auction (Ad Rank + GSP). Layers 2 and 3 are Smart Bidding and Performance Max. Public learning artifact, mirrors `/projects/search-engine`.

## Read first

- [`README.md`](README.md) — public-facing project description, pipeline diagram, tech stack, four wrong-intuition demos
- [`PLAN.md`](PLAN.md) — phase-by-phase implementation plan, tech-stack rationale, scope boundaries, definition of done
- [`ideas/01-mini-google-ads.md`](ideas/01-mini-google-ads.md) — concept doc

## Core decisions (do not relitigate without explicit ask)

- **The auction is the centerpiece.** Quality Score, Smart Bidding, Performance Max are layers on top. Phase 1 ships the auction first.
- **Synthetic data only.** No real ad inventory, no real money, no mobile or programmatic RTB. Google Ads paid search and PMax simulation only.
- **Tech stack mirrors search-engine.** Next.js + React Flow + Tailwind on the frontend. FastAPI + Python + Postgres + pgvector on the backend. LightGBM for Smart Bidding. Voyage embeddings for broad match. Railway for hosting.
- **Definition of done is Phase 4.** Phase 5 (Performance Max) and Phase 6 (polish) are upside, not blockers.

## Voice and writing rules

Inherits everything from the workspace `/personal/CLAUDE.md`:

- No em-dash. No emoji.
- Direct, no fluff, no trailing recap.
- Frame Viet as a leader who ships systems, not as a builder or engineer.
- For commit messages, use the `git-commit-viet` skill.

## Phase status

| Phase | Status | Demo state |
|-------|--------|-----------|
| 0. Scaffold | not started | repo + schema + seed data |
| 1. Auction MVP | not started | type a query, see Ad Rank + GSP + slots |
| 2. Quality Score depth | not started | drag QS slider, watch winner change |
| 3. Match types | not started | broad match expansion via embeddings |
| 4. Smart Bidding ML | not started | same query, different bid per user signal |
| 5. Performance Max | optional | budget allocates across channels via ML |
| 6. Public polish | optional | guided demo, deployed, shareable URL |

## Don't

- Don't add features outside the current phase. Each phase has a Demo State, ship that, move on.
- Don't add real-money flows, real ad inventory, or real bidding APIs. The point is pedagogical, not commercial.
- Don't ship Phase 5 or Phase 6 work before Phase 4. The four wrong-intuition demos are the bar.
- Don't push to `main` without explicit permission.
- Don't auto-deploy to Railway. Always confirm before `railway up` or `npm run deploy`.
- Don't skip git hooks or signing.
