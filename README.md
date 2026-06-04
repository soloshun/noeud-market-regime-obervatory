# Noeud Regime Observatory

Internal dashboard for the [Noeud Market Regime](../noeud-market-regime) deterministic FX market-regime engine and its LLM validation layer.

It surfaces, for every supported pair, the full deterministic snapshot (volatility, trend, acceleration, regime, term structure, multipliers, VaR, hedge cost, backtest, integrity checks), the LLM validation trace (status, confidence, research brief, evidence, ensemble scorers, raw model responses), and ingestion provenance (provider runs).

## Stack

- Next.js App Router (16) + TypeScript
- shadcn/ui (`radix-rhea` registry) for every component
- Recharts via the shadcn chart wrapper
- TanStack Query (data fetching) + TanStack Table (sortable tables)
- Zustand (filter state) · next-themes · sonner

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Overview — KPI cards, regime distribution, acceleration leaderboard, all-pairs table |
| `/pairs` | Pair grid (searchable) |
| `/pairs/[pair]` | Full per-pair snapshot, charts, and inline validation |
| `/validation` | Validation overview — status KPIs and runs table |
| `/validation/[pair]` | Full LLM validation trace for a pair |
| `/data-health` | Provider runs and ingestion status |
| `/help` | Methodology — regime bands, metrics, the validation pipeline |

## Data layer & the Supabase swap seam

The backend (a Next.js API reading from Supabase) is built separately. To keep the
frontend decoupled and demoable today, the data flows through one clean seam:

```
UI (hooks/use-regime.ts)
  -> lib/api.ts (axios, same-origin /api)
    -> app/api/* route handlers   <-- the swap seam
      -> lib/mock/dataset.ts (fixtures, today)
         lib/mock/engine.ts  (faithful TS port of the regime math)
```

`lib/mock/*` is a deterministic, seeded re-implementation of the deterministic
engine (`calculations/market_regime.py`) producing internally-consistent fixtures
that match the real payload contracts in `lib/types.ts`. When the Supabase backend
lands, **only the `app/api/*` route handlers change** — they query Supabase instead
of the fixtures. Nothing in the UI, hooks, or types moves.

Point the client at an external API instead by setting `NEXT_PUBLIC_API_BASE_URL`.

## Contracts

`lib/types.ts` mirrors the backend shapes exactly:

- the sectioned per-pair payload from `presentation/market_regime_payload.py`
- the persisted records in `storage/models.py`
- the LLM validation contracts in `intelligence/models.py`

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```
