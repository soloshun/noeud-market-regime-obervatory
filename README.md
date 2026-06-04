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

## Data layer

The frontend reads through same-origin Next.js route handlers. Those handlers use
Supabase when it is configured, and fall back to the deterministic fixture dataset
when local env vars are absent.

```
UI (hooks/use-regime.ts)
  -> lib/api.ts (axios, same-origin /api)
    -> app/api/* route handlers
      -> lib/server-data.ts
        -> Supabase REST tables/views when configured
        -> lib/mock/dataset.ts fixtures otherwise
```

Set:

```bash
OBSERVATORY_DATA_SOURCE=auto          # auto | supabase | mock
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...         # preferred for server routes
# or SUPABASE_ANON_KEY=...            # works for read-only RLS policies
```

The live reader uses:

- `latest_market_regime_snapshots`
- `market_regime_snapshots`
- `raw_price_observations`
- `provider_runs`
- `latest_llm_validation_runs`

`lib/mock/*` remains a deterministic, seeded re-implementation of the engine so
the UI is still demoable before Supabase is configured.

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
