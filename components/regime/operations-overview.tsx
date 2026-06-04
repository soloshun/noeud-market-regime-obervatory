"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  ExternalLinkIcon,
  GaugeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import { RegimeBadge, ValidationStatusBadge } from "@/components/regime/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRate,
} from "@/lib/format";
import type { ProviderRun, RegimeSnapshot, ValidationRun } from "@/lib/types";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0 border-l pl-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function latestRun(runs: ProviderRun[]) {
  return [...runs].sort((a, b) => {
    const left = a.completed_at ?? a.requested_at ?? "";
    const right = b.completed_at ?? b.requested_at ?? "";
    return right.localeCompare(left);
  })[0];
}

export function OperationsOverview({
  snapshots,
  validations,
  providerRuns,
  asOf,
}: {
  snapshots: RegimeSnapshot[];
  validations: ValidationRun[];
  providerRuns: ProviderRun[];
  asOf: string | null;
}) {
  const latestAsOf =
    asOf ??
    snapshots.reduce<string | null>(
      (latest, snapshot) =>
        !latest || snapshot.as_of_date > latest ? snapshot.as_of_date : latest,
      null,
    );
  const elevated = snapshots.filter((snapshot) =>
    ["ELEVATED", "STRESSED", "CRISIS"].includes(
      snapshot.current_volatility_readings.regime,
    ),
  );
  const backtestPasses = snapshots.filter(
    (snapshot) => snapshot.backtest_validation_results.system_status === "PASS",
  ).length;
  const validationAligned = validations.filter((run) =>
    ["supports", "partially_supports"].includes(run.status),
  ).length;
  const validationEscalations = validations.filter(
    (run) =>
      run.status === "contradicts" ||
      run.result.recommended_action === "escalate_for_human_review",
  );
  const failedRuns = providerRuns.filter(
    (run) => !["success", "succeeded", "skipped"].includes(run.status),
  );
  const lastRun = latestRun(providerRuns);
  const focusPairs = [...snapshots]
    .sort((a, b) => {
      const bScore =
        b.current_volatility_readings.regime_score * 10 +
        b.current_volatility_readings.accel_vs_252d;
      const aScore =
        a.current_volatility_readings.regime_score * 10 +
        a.current_volatility_readings.accel_vs_252d;
      return bScore - aScore;
    })
    .slice(0, 5);
  const validationByPair = new Map(validations.map((run) => [run.pair_code, run]));

  return (
    <section className="space-y-5 border-b pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Regime Engine Observatory</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Deterministic FX regime snapshots, yfinance provenance, and LLM
            validation are monitored here as separate audit layers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/validation">
              <SparklesIcon className="size-3.5" />
              Validation tape
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/data-health">
              <DatabaseIcon className="size-3.5" />
              Provider runs
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={GaugeIcon}
          label="Latest Snapshot"
          value={formatDate(latestAsOf)}
          hint={`${snapshots.length} active pairs`}
        />
        <Metric
          icon={AlertTriangleIcon}
          label="Elevated+"
          value={`${elevated.length}/${snapshots.length}`}
          hint="Pairs above normal regime"
        />
        <Metric
          icon={ShieldCheckIcon}
          label="VaR Pass Rate"
          value={formatPercent(backtestPasses / Math.max(snapshots.length, 1), 0)}
          hint="99% historical coverage"
        />
        <Metric
          icon={SparklesIcon}
          label="LLM Alignment"
          value={formatPercent(validationAligned / Math.max(validations.length, 1), 0)}
          hint={`${validationEscalations.length} escalation flags`}
        />
        <Metric
          icon={CheckCircle2Icon}
          label="Last Provider Run"
          value={lastRun?.status ?? "--"}
          hint={lastRun ? `${lastRun.pair_code} · ${formatDateTime(lastRun.completed_at)}` : "--"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-medium">Risk Focus</h3>
              <p className="text-xs text-muted-foreground">
                Highest regime-score and acceleration pairs to review first
              </p>
            </div>
            {failedRuns.length > 0 && (
              <span className="rounded-md border border-red-600/25 bg-red-600/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
                {failedRuns.length} failed runs
              </span>
            )}
          </div>
          <div className="divide-y">
            {focusPairs.map((snapshot) => {
              const vol = snapshot.current_volatility_readings;
              const validation = validationByPair.get(snapshot.pair);
              return (
                <Link
                  key={snapshot.pair}
                  href={`/pairs/${snapshot.pair}`}
                  className="grid gap-3 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[120px_1fr_150px]"
                >
                  <div>
                    <div className="font-mono text-sm font-semibold">
                      {snapshot.display_pair}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {formatRate(snapshot.live_spot_rates.spot_rate)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <RegimeBadge regime={vol.regime} score={vol.regime_score} />
                      {validation && <ValidationStatusBadge status={validation.status} />}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                      <span>
                        <span className="text-muted-foreground">Accel </span>
                        <span className="font-mono">{formatNumber(vol.accel_vs_252d, 2)}x</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">30d </span>
                        <span className="font-mono">{formatPercent(vol.vol_30d, 1)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">252d </span>
                        <span className="font-mono">{formatPercent(vol.vol_252d, 1)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Progress
                      value={Math.min(vol.accel_vs_252d / 2.5, 1) * 100}
                      className="h-1.5 w-24"
                    />
                    <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-medium">Validation Audit State</h3>
            <p className="text-xs text-muted-foreground">
              Latest ensemble verdicts and required actions
            </p>
          </div>
          <div className="divide-y">
            {validations.slice(0, 5).map((run) => (
              <Link
                key={run.id}
                href={`/validation/${run.pair_code}`}
                className="block px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold">
                    {run.result.display_pair}
                  </span>
                  <ValidationStatusBadge status={run.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {run.result.validation_summary}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{run.model_name}</span>
                  <span className={cn("size-1 rounded-full bg-muted-foreground/40")} />
                  <span>{formatNumber((run.confidence ?? 0) * 100, 0)}% confidence</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
