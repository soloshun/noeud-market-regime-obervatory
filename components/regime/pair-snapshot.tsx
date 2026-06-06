import * as React from "react";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CalculatorIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";

import {
  BacktestBadge,
  BoolPill,
  RegimeBadge,
  SignalBadge,
} from "@/components/regime/badges";
import { Card } from "@/components/ui/card";
import {
  formatDate,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatRate,
  formatSignedPercent,
  formatVol,
  titleCase,
} from "@/lib/format";
import { regimeTone } from "@/lib/regime";
import { cn } from "@/lib/utils";
import type { RegimeSnapshot } from "@/lib/types";

export function PairHeaderCard({ snapshot }: { snapshot: RegimeSnapshot }) {
  const v = snapshot.current_volatility_readings;
  const spot = snapshot.live_spot_rates;
  const up = (spot.day_change ?? 0) >= 0;
  const localRiskMove = spot.day_change_pct;
  const tone = regimeTone(v.regime);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-b pb-5">
      <div className="flex items-center gap-4">
        <span
          className="h-9 w-1 rounded-full"
          style={{ backgroundColor: tone.hex }}
          aria-hidden
        />
        <div>
          <div className="font-mono text-2xl font-semibold tracking-tight">
            {snapshot.display_pair}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            As of {formatDate(snapshot.as_of_date)} · {snapshot.market_data_provider}
          </div>
        </div>
        <RegimeBadge regime={v.regime} score={v.regime_score} />
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {formatRate(spot.spot_rate)}
          </span>
          <span
            className={cn(
              "flex items-center gap-0.5 font-mono text-sm tabular-nums",
              localRiskMove != null && localRiskMove > 0 && "text-red-600 dark:text-red-400",
              localRiskMove != null && localRiskMove < 0 && "text-emerald-600 dark:text-emerald-400",
            )}
            title="Color is local-currency risk: positive USD/GHS means GHS weakness and is shown adverse."
          >
            {up ? <ArrowUpRightIcon className="size-3.5" /> : <ArrowDownRightIcon className="size-3.5" />}
            {formatSignedPercent(spot.day_change_pct)}
          </span>
        </div>
        <HeaderStat label="Acceleration" value={`${formatNumber(v.accel_vs_252d, 2)}x`} />
        <HeaderStat label="Vol 30d" value={formatVol(v.vol_30d)} />
        <HeaderStat
          label="Signal"
          value={<SignalBadge signal={snapshot.volatility_trend_signals.composite_signal} />}
        />
      </div>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function PairAuditSummary({ snapshot }: { snapshot: RegimeSnapshot }) {
  const v = snapshot.current_volatility_readings;
  const t = snapshot.volatility_trend_signals;
  const bt = snapshot.backtest_validation_results;
  const varr = snapshot.historical_var;
  const checks = snapshot.system_validation_checks;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;

  const items = [
    {
      icon: DatabaseIcon,
      label: "Market data",
      value: snapshot.market_data_provider,
      hint: `${snapshot.display_pair} close as of ${formatDate(snapshot.as_of_date)}`,
    },
    {
      icon: CalculatorIcon,
      label: "Regime basis",
      value: `${formatNumber(v.accel_vs_252d, 2)}x acceleration`,
      hint: "30d realized volatility divided by 252d baseline",
    },
    {
      icon: TrendingUpIcon,
      label: "Trend overlay",
      value: titleCase(t.composite_signal),
      hint: `10d ${formatNumber(t.trend_10d, 2)}x · 30d ${formatNumber(t.trend_30d, 2)}x · 90d ${formatNumber(t.trend_90d, 2)}x`,
    },
    {
      icon: ShieldCheckIcon,
      label: "Audit checks",
      value: `${passedChecks}/${totalChecks} passed`,
      hint: `VaR coverage ${formatPercent(bt.var_99_coverage)} · fat-tail ${formatNumber(varr.fat_tail_ratio, 2)}x`,
    },
  ];

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <item.icon className="size-3.5" />
              {item.label}
            </div>
            <div className="mt-1 text-sm font-medium">{item.value}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Spec-sheet layout ----------------------------------------------------

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Section({
  title,
  action,
  children,
  cols = 2,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  cols?: 1 | 2;
}) {
  return (
    <div className="px-5 py-4">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      <div className={cn(cols === 2 && "grid grid-cols-1 gap-x-10 sm:grid-cols-2")}>
        {children}
      </div>
    </div>
  );
}

export function PairSnapshotGrid({ snapshot }: { snapshot: RegimeSnapshot }) {
  const spot = snapshot.live_spot_rates;
  const v = snapshot.current_volatility_readings;
  const t = snapshot.volatility_trend_signals;
  const ts = snapshot.volatility_term_structure;
  const m = snapshot.dynamic_trend_aware_regime_multiplier;
  const hedge = snapshot.hedge_cost_parameters;
  const varr = snapshot.historical_var;
  const bt = snapshot.backtest_validation_results;
  const checks = snapshot.system_validation_checks;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="gap-0 py-0 *:divide-y">
        <div className="divide-y">
          <Section title="Live Spot Rates">
            <Row label="Spot rate" value={formatRate(spot.spot_rate)} />
            <Row label="Prior close" value={formatRate(spot.prior_close)} />
            <Row label="Day change" value={formatRate(spot.day_change)} />
            <Row label="Day change %" value={formatSignedPercent(spot.day_change_pct)} />
          </Section>

          <Section
            title="Volatility Readings"
            action={<RegimeBadge regime={v.regime} score={v.regime_score} />}
          >
            <Row label="Vol 7d" value={formatVol(v.vol_7d)} />
            <Row label="Vol 30d" value={formatVol(v.vol_30d)} />
            <Row label="Vol 60d" value={formatVol(v.vol_60d)} />
            <Row label="Vol 90d" value={formatVol(v.vol_90d)} />
            <Row label="Vol 180d" value={formatVol(v.vol_180d)} />
            <Row label="Vol 252d" value={formatVol(v.vol_252d)} />
            <Row label="Accel vs 252d" value={`${formatNumber(v.accel_vs_252d, 2)}x`} />
          </Section>

          <Section title="Trend Signals">
            <Row label="Trend 10d" value={<span className="flex items-center gap-2">{formatNumber(t.trend_10d, 2)}x <SignalBadge signal={t.short_signal} /></span>} />
            <Row label="Trend 30d" value={<span className="flex items-center gap-2">{formatNumber(t.trend_30d, 2)}x <SignalBadge signal={t.med_signal} /></span>} />
            <Row label="Trend 90d" value={<span className="flex items-center gap-2">{formatNumber(t.trend_90d, 2)}x <SignalBadge signal={t.long_signal} /></span>} />
            <Row label="Composite" value={<SignalBadge signal={t.composite_signal} />} />
          </Section>
        </div>
      </Card>

      <Card className="gap-0 py-0">
        <div className="divide-y">
          <Section title="Term Structure">
            <Row label="≤7d" value={formatVol(ts.tenor_le_7d)} />
            <Row label="≤30d" value={formatVol(ts.tenor_le_30d)} />
            <Row label="≤60d" value={formatVol(ts.tenor_le_60d)} />
            <Row label="≤90d" value={formatVol(ts.tenor_le_90d)} />
            <Row label="≤180d" value={formatVol(ts.tenor_le_180d)} />
            <Row label=">180d" value={formatVol(ts.tenor_gt_180d)} />
          </Section>

          <Section title="Trend-Aware Multipliers">
            <Row label="≤14d" value={formatMultiplier(m.tenor_le_14d)} />
            <Row label="≤30d" value={formatMultiplier(m.tenor_le_30d)} />
            <Row label="≤60d" value={formatMultiplier(m.tenor_le_60d)} />
            <Row label="≤90d" value={formatMultiplier(m.tenor_le_90d)} />
            <Row label="≤180d" value={formatMultiplier(m.tenor_le_180d)} />
            <Row label=">180d" value={formatMultiplier(m.tenor_gt_180d)} />
            <div className="col-span-full pt-1 text-xs text-muted-foreground">
              Confidence: {titleCase(m.confidence)}
            </div>
          </Section>

          <Section title="Historical VaR">
            <Row label="Hist VaR 99% 1d" value={formatVol(varr.hist_var_99_1day, 2)} />
            <Row label="Hist VaR 99% 30d" value={formatVol(varr.hist_var_99_30day, 2)} />
            <Row label="Parametric VaR 30d" value={formatVol(varr.parametric_var_30d, 2)} />
            <Row label="Fat tail ratio" value={formatNumber(varr.fat_tail_ratio, 2)} />
          </Section>

          <Section title="Hedging & Backtest">
            <Row label="Fwd cost (annual)" value={formatPercent(hedge.fwd_cost_annual_pct)} />
            <Row label="Typical bid/ask" value={formatPercent(hedge.typical_bid_ask_spread)} />
            <Row label="Hedgeability" value={`${hedge.hedgeability_score} / 10`} />
            <Row label="VaR 99% coverage" value={formatPercent(bt.var_99_coverage)} />
            <Row label="Backtest status" value={<BacktestBadge status={bt.system_status} />} />
            <div className="col-span-full pt-1 text-xs text-muted-foreground">{hedge.notes}</div>
          </Section>

          <Section title="Integrity Checks" cols={1}>
            <div className="flex flex-wrap gap-2">
              <BoolPill value={checks.spot_rates_loaded} label="Spot rates loaded" />
              <BoolPill value={checks.multipliers_in_valid_range} label="Multipliers in range" />
              <BoolPill value={checks.term_structure_complete} label="Term structure complete" />
              <BoolPill value={checks.historical_var_available} label="Historical VaR available" />
            </div>
          </Section>
        </div>
      </Card>
    </div>
  );
}
