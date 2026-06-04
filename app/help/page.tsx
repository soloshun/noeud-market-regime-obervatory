import { RegimeBadge } from "@/components/regime/badges";
import { SectionTitle } from "@/components/regime/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { REGIME_DESCRIPTIONS } from "@/lib/regime";

const REGIME_BANDS = [
  { regime: "CALM", range: "accel < 0.80", score: 1 },
  { regime: "NORMAL", range: "0.80 ≤ accel < 1.20", score: 2 },
  { regime: "ELEVATED", range: "1.20 ≤ accel < 1.80", score: 3 },
  { regime: "STRESSED", range: "1.80 ≤ accel < 2.50", score: 4 },
  { regime: "CRISIS", range: "accel ≥ 2.50", score: 5 },
] as const;

const METRICS = [
  {
    name: "Acceleration (accel vs 252d)",
    body: "Ratio of 30-day annualized volatility to 252-day annualized volatility. The single number that drives regime classification — it measures how fast volatility is building relative to its annual baseline.",
  },
  {
    name: "Volatility windows",
    body: "Annualized realized volatility computed over 7, 30, 60, 90, 180 and 252 trading-day lookbacks from log returns. Shorter windows react faster; longer windows define the baseline.",
  },
  {
    name: "Trend signals",
    body: "10d / 30d / 90d ratios of recent mean volatility to the prior equal-length window. RISING above 1.08, FALLING below 0.92, otherwise FLAT. The composite is STRONG_RISING / STRONG_FALLING / FLAT / MIXED.",
  },
  {
    name: "Term structure",
    body: "Tenor-matched annualized volatility blending the 30d front and 252d anchor by tenor weight, giving a vol estimate per hedge horizon (≤7d through >180d).",
  },
  {
    name: "Trend-aware multipliers",
    body: "Bounded [0.8x, 3.0x] tenor multipliers derived from acceleration plus a trend adjustment. Used to scale exposures by hedge horizon. The ≤14d bucket only takes upside trend adjustment.",
  },
  {
    name: "Historical VaR & fat tail",
    body: "99% historical value-at-risk from the 252-day distribution of absolute returns (1d, scaled to 30d), a parametric 30d VaR, and their ratio as a fat-tail indicator.",
  },
  {
    name: "Backtest validation",
    body: "Rolling 1-day VaR coverage versus the 99% target. PASS at or above target, ACCEPTABLE within 1.5pp, otherwise FAIL.",
  },
];

const PIPELINE = [
  { step: "1 · Retrieval", body: "perplexity/sonar gathers current market context (macro, central bank, currency-specific) and returns cited evidence." },
  { step: "2 · Scoring", body: "One or more scorer models independently judge whether external context supports the deterministic read over the shared research brief." },
  { step: "3 · Aggregation", body: "anthropic/claude-sonnet-4.5 aggregates the views using the research brief and citations as the factual anchor — not a majority vote." },
];

export default function HelpPage() {
  return (
    <>
      <SectionTitle description="How the deterministic engine reads the market, and how the LLM layer validates it.">
        Methodology
      </SectionTitle>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regime Bands</CardTitle>
          <CardDescription>
            Regimes are classified purely from acceleration — the 30d / 252d volatility ratio.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6">Regime</TableHead>
                <TableHead>Acceleration band</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="px-6">Reading</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REGIME_BANDS.map((b) => (
                <TableRow key={b.regime}>
                  <TableCell className="px-6"><RegimeBadge regime={b.regime} /></TableCell>
                  <TableCell className="font-mono text-sm">{b.range}</TableCell>
                  <TableCell className="font-mono">{b.score}</TableCell>
                  <TableCell className="px-6 text-sm text-muted-foreground">
                    {REGIME_DESCRIPTIONS[b.regime]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {METRICS.map((m) => (
          <Card key={m.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{m.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">{m.body}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">LLM Validation Pipeline</CardTitle>
          <CardDescription>
            The intelligence layer validates the deterministic snapshot. It never overrides the engine — the calculation is always the source of truth.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PIPELINE.map((p) => (
            <div key={p.step} className="rounded-lg border p-4">
              <div className="text-sm font-semibold">{p.step}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Source</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          Prices are ingested daily from yfinance and normalized into per-pair daily closes. Sparse direct
          histories (e.g. GBP/GHS) are synthesized from liquid USD anchor legs, then overlaid with any direct
          quotes Yahoo provides. The deterministic engine reads stored prices, computes the snapshot, and persists
          it; the LLM layer validates the latest snapshot against grounded market context. This observatory reads
          those snapshots, validation runs, and provider runs through the internal API.
        </CardContent>
      </Card>
    </>
  );
}
