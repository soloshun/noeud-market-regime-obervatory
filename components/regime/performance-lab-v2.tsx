"use client";

import * as React from "react";
import {
  CartesianGrid,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type {
  BenchmarkEvaluationStatus,
  BenchmarkResult,
  SignalHorizonBenchmarkResult,
  TrendAwareMultiplierMap,
  ValidationRun,
} from "@/lib/types";

const TENORS: (keyof TrendAwareMultiplierMap)[] = [
  "tenor_le_14d",
  "tenor_le_30d",
  "tenor_le_60d",
  "tenor_le_90d",
  "tenor_le_180d",
  "tenor_gt_180d",
];

const TENOR_LABELS: Record<keyof TrendAwareMultiplierMap, string> = {
  tenor_le_14d: "≤14d",
  tenor_le_30d: "≤30d",
  tenor_le_60d: "≤60d",
  tenor_le_90d: "≤90d",
  tenor_le_180d: "≤180d",
  tenor_gt_180d: ">180d",
};

type Scope = "canonical" | "all";
type MemoryScope = "all" | "with_memory" | "without_memory";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function formatVol(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}pp`;
}

function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function methodLabel(method: string) {
  if (method === "tenor_matched_v2") return "Tenor matched · primary";
  if (method === "legacy_vol252d_v1") return "252d anchor · diagnostic";
  return method;
}

function qlikeLoss(forecastVol: number, realizedVol: number) {
  const forecastVariance = Math.max(forecastVol ** 2, 1e-12);
  const realizedVariance = Math.max(realizedVol ** 2, 1e-12);
  return Math.log(forecastVariance) + realizedVariance / forecastVariance;
}

function uniqueCount<T>(rows: T[], key: (row: T) => string) {
  return new Set(rows.map(key)).size;
}

function clusterInterval(rows: BenchmarkResult[]) {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const values = groups.get(row.as_of_date) ?? [];
    values.push(row.llm_lift);
    groups.set(row.as_of_date, values);
  }
  const dateLifts = [...groups.values()].map(average);
  if (dateLifts.length < 2) return null;
  const mean = average(dateLifts);
  const variance =
    dateLifts.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (dateLifts.length - 1);
  const margin = 1.96 * Math.sqrt(variance / dateLifts.length);
  return { low: mean - margin, high: mean + margin };
}

function balancedDirectionAccuracy(rows: BenchmarkResult[]) {
  const directions = ["increase", "decrease", "hold"];
  const rates = directions
    .map((direction) => rows.filter((row) => row.llm_direction === direction))
    .filter((group) => group.length > 0)
    .map((group) => group.filter((row) => row.direction_hit).length / group.length);
  return rates.length ? average(rates) : 0;
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 border-r border-border/70 px-4 py-3 last:border-r-0">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={hint}>{hint}</p>
    </div>
  );
}

export function PerformanceLabV2({
  results,
  signalHorizonResults,
  statuses,
  validations,
}: {
  results: BenchmarkResult[];
  signalHorizonResults: SignalHorizonBenchmarkResult[];
  statuses: BenchmarkEvaluationStatus[];
  validations: ValidationRun[];
}) {
  const methods = React.useMemo(
    () =>
      [...new Set(results.map((row) => row.benchmark_method_version || "legacy_vol252d_v1"))]
        .sort((left, right) => {
          if (left === right) return 0;
          return left === "tenor_matched_v2" ? -1 : 1;
        }),
    [results],
  );
  const [method, setMethod] = React.useState(methods[0] ?? "tenor_matched_v2");
  const [pair, setPair] = React.useState("all");
  const [tenor, setTenor] = React.useState("all");
  const [scope, setScope] = React.useState<Scope>("canonical");
  const [model, setModel] = React.useState("all");
  const [prompt, setPrompt] = React.useState("all");
  const [runSource, setRunSource] = React.useState("all");
  const [memoryScope, setMemoryScope] = React.useState<MemoryScope>("all");
  const [regime, setRegime] = React.useState("all");
  const hasCanonical = results.some((row) => row.is_canonical);
  const activeMethod = methods.includes(method) ? method : (methods[0] ?? method);
  const validationById = React.useMemo(
    () => new Map(validations.map((run) => [run.id, run])),
    [validations],
  );
  const matchesMetadata = React.useCallback(
    (validationRunId: string | null) => {
      const run = validationRunId ? validationById.get(validationRunId) : undefined;
      if (!run) {
        return model === "all" && prompt === "all" && runSource === "all" && memoryScope === "all" && regime === "all";
      }
      const hasMemory = run.prior_validation_context.item_count > 0;
      return (
        (model === "all" || run.model_name === model) &&
        (prompt === "all" || run.prompt_version === prompt) &&
        (runSource === "all" || run.run_source === runSource) &&
        (regime === "all" || run.result.deterministic_regime === regime) &&
        (memoryScope === "all" || (memoryScope === "with_memory" ? hasMemory : !hasMemory))
      );
    },
    [memoryScope, model, prompt, regime, runSource, validationById],
  );

  const filtered = React.useMemo(
    () =>
      results.filter((row) => {
        const rowMethod = row.benchmark_method_version || "legacy_vol252d_v1";
        return (
          rowMethod === activeMethod &&
          (scope === "all" || !hasCanonical || row.is_canonical) &&
          (pair === "all" || row.pair_code === pair) &&
          (tenor === "all" || row.tenor_key === tenor) &&
          matchesMetadata(row.llm_validation_run_id)
        );
      }),
    [activeMethod, hasCanonical, matchesMetadata, pair, results, scope, tenor],
  );

  const filteredSignal = React.useMemo(
    () =>
      signalHorizonResults.filter((row) => {
        const rowMethod = row.benchmark_method_version || "legacy_vol252d_v1";
        return (
          rowMethod === activeMethod &&
          (scope === "all" || !hasCanonical || row.is_canonical) &&
          (pair === "all" || row.pair_code === pair) &&
          (tenor === "all" || row.tenor_key === tenor) &&
          matchesMetadata(row.llm_validation_run_id)
        );
      }),
    [activeMethod, hasCanonical, matchesMetadata, pair, scope, signalHorizonResults, tenor],
  );

  const filteredStatuses = statuses.filter(
    (row) =>
      row.benchmark_method_version === activeMethod &&
      (scope === "all" || !hasCanonical || row.is_canonical) &&
      (pair === "all" || row.pair_code === pair) &&
      (tenor === "all" || row.tenor_key === tenor) &&
      matchesMetadata(row.llm_validation_run_id),
  );
  const quantMae = average(filtered.map((row) => row.quant_abs_error));
  const llmMae = average(filtered.map((row) => row.llm_abs_error));
  const maeReduction = quantMae ? (quantMae - llmMae) / quantMae : 0;
  const quantBias = average(filtered.map((row) => row.quant_implied_vol - row.realized_vol));
  const llmBias = average(filtered.map((row) => row.llm_implied_vol - row.realized_vol));
  const quantQlike = average(filtered.map((row) => qlikeLoss(row.quant_implied_vol, row.realized_vol)));
  const llmQlike = average(filtered.map((row) => qlikeLoss(row.llm_implied_vol, row.realized_vol)));
  const qlikeLift = quantQlike - llmQlike;
  const quantUndercoverage = filtered.length
    ? filtered.filter((row) => row.quant_undercovered).length / filtered.length
    : 0;
  const llmUndercoverage = filtered.length
    ? filtered.filter((row) => row.llm_undercovered).length / filtered.length
    : 0;
  const directionAccuracy = balancedDirectionAccuracy(filtered);
  const alwaysDecrease = filtered.length
    ? filtered.filter((row) => row.realized_vol < row.quant_implied_vol * 0.95).length /
      filtered.length
    : 0;
  const interval = clusterInterval(filtered);

  const chartRows = TENORS.map((key) => {
    const rows = filtered.filter((row) => row.tenor_key === key);
    return {
      tenor: TENOR_LABELS[key],
      quant: average(rows.map((row) => row.quant_abs_error)),
      llm: average(rows.map((row) => row.llm_abs_error)),
      lift: average(rows.map((row) => row.llm_lift)),
      count: rows.length,
    };
  }).filter((row) => row.count > 0);

  const experimentRuns = validations.filter((run) => run.experiment_id);
  const experimentIds = uniqueCount(experimentRuns, (run) => run.experiment_id ?? run.id);
  const matchedExperiments = new Map<string, Set<string>>();
  for (const run of experimentRuns) {
    const variants = matchedExperiments.get(run.experiment_id ?? "") ?? new Set<string>();
    if (run.experiment_variant) variants.add(run.experiment_variant);
    matchedExperiments.set(run.experiment_id ?? "", variants);
  }
  const completePairs = [...matchedExperiments.values()].filter(
    (variants) => variants.has("memory_off") && variants.has("memory_on"),
  ).length;

  const pairs = [...new Set(results.map((row) => row.pair_code))].sort();
  const models = [...new Set(validations.map((run) => run.model_name).filter(Boolean))].sort();
  const prompts = [
    ...new Set(
      validations
        .map((run) => run.prompt_version)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const runSources = [...new Set(validations.map((run) => run.run_source))].sort();
  const regimes = [...new Set(validations.map((run) => run.result.deterministic_regime))].sort();
  const selectedRuns = [
    ...new Set(
      filtered
        .map((row) => row.llm_validation_run_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ]
    .map((id) => validationById.get(id))
    .filter((run): run is ValidationRun => Boolean(run));
  const decreaseShare = selectedRuns.length
    ? selectedRuns.filter((run) => run.trend_adjustment_direction === "decrease").length /
      selectedRuns.length
    : 0;
  const flaggedRuns = selectedRuns.filter(
    (run) => run.result.output_quality_flags.length > 0,
  ).length;
  const health = {
    scored: filteredStatuses.filter((row) => row.status === "scored").length,
    pending: filteredStatuses.filter((row) => row.status === "pending").length,
    invalid: filteredStatuses.filter((row) => row.status === "invalid").length,
    notApplicable: filteredStatuses.filter((row) => row.status === "not_applicable").length,
    rolled: filtered.filter((row) => row.maturity_rolled).length,
  };

  return (
    <div className="space-y-5">
      <section className="border-y bg-card/30">
        <div className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Evaluation cohort</p>
            <p className="mt-1 text-sm">One method and one canonical production run per pair/date by default.</p>
          </div>
          <Select value={activeMethod} onValueChange={setMethod}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>{methods.map((item) => <SelectItem key={item} value={item}>{methodLabel(item)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={pair} onValueChange={setPair}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="All pairs" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All pairs</SelectItem>{pairs.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={tenor} onValueChange={setTenor}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="All tenors" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All tenors</SelectItem>{TENORS.map((item) => <SelectItem key={item} value={item}>{TENOR_LABELS[item]}</SelectItem>)}</SelectContent>
          </Select>
          <ToggleGroup type="single" value={scope} onValueChange={(value) => value && setScope(value as Scope)} variant="outline">
            <ToggleGroupItem value="canonical">Canonical</ToggleGroupItem>
            <ToggleGroupItem value="all">All runs</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid gap-2 border-t px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue placeholder="All scorer models" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All scorer models</SelectItem>{models.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={prompt} onValueChange={setPrompt}>
            <SelectTrigger><SelectValue placeholder="All prompt versions" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All prompt versions</SelectItem>{prompts.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={memoryScope} onValueChange={(value) => setMemoryScope(value as MemoryScope)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All memory modes</SelectItem><SelectItem value="with_memory">Prior reads used</SelectItem><SelectItem value="without_memory">No prior reads</SelectItem></SelectContent>
          </Select>
          <Select value={runSource} onValueChange={setRunSource}>
            <SelectTrigger><SelectValue placeholder="All run sources" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All run sources</SelectItem>{runSources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={regime} onValueChange={setRegime}>
            <SelectTrigger><SelectValue placeholder="All regimes" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All regimes</SelectItem>{regimes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid grid-cols-2 border-y bg-card/20 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Quant MAE" value={filtered.length ? formatVol(quantMae) : "--"} hint="Mean absolute volatility error" />
        <Metric label="LLM MAE" value={filtered.length ? formatVol(llmMae) : "--"} hint="Shadow overlay error" />
        <Metric label="MAE reduction" value={filtered.length ? formatPercent(maeReduction) : "--"} hint="Positive means LLM improved" />
        <Metric label="QLIKE lift" value={filtered.length ? qlikeLift.toFixed(3) : "--"} hint="Positive means better variance calibration" />
        <Metric label="Balanced direction" value={filtered.length ? formatPercent(directionAccuracy) : "--"} hint={`Always-decrease baseline ${formatPercent(alwaysDecrease)}`} />
        <Metric label="Undercoverage Δ" value={filtered.length ? formatPercent(llmUndercoverage - quantUndercoverage) : "--"} hint="Negative means LLM undercovered less often" />
        <Metric label="Quant bias" value={filtered.length ? formatVol(quantBias) : "--"} hint="Positive means overforecast" />
        <Metric label="LLM bias" value={filtered.length ? formatVol(llmBias) : "--"} hint="Positive means overforecast" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="border p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div><h2 className="text-base font-semibold">Fixed-tenor forecast error</h2><p className="text-sm text-muted-foreground">Quant and LLM error by exposure tenor</p></div>
            <span className="font-mono text-xs text-muted-foreground">{filtered.length} rows · {uniqueCount(filtered, (row) => row.llm_validation_run_id ?? row.id)} runs</span>
          </div>
          <ChartContainer config={{ quant: { label: "Quant", color: "var(--chart-4)" }, llm: { label: "LLM", color: "var(--chart-1)" } }} className="h-[280px] w-full">
            <BarChart data={chartRows}><CartesianGrid vertical={false} /><XAxis dataKey="tenor" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}`} width={34} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => formatVol(Number(value))} />} /><Bar dataKey="quant" fill="var(--color-quant)" radius={3} /><Bar dataKey="llm" fill="var(--color-llm)" radius={3} /></BarChart>
          </ChartContainer>
        </div>
        <div className="border p-4">
          <h2 className="text-base font-semibold">Cohort integrity</h2>
          <p className="text-sm text-muted-foreground">Independent samples and evaluator health</p>
          <dl className="mt-4 divide-y text-sm">
            {[
              ["Validation runs", uniqueCount(filtered, (row) => row.llm_validation_run_id ?? row.id)],
              ["Pair/date observations", uniqueCount(filtered, (row) => `${row.pair_code}:${row.as_of_date}`)],
              ["Market dates", uniqueCount(filtered, (row) => row.as_of_date)],
              ["Scored candidates", health.scored || filtered.length],
              ["Pending candidates", health.pending],
              ["Invalid candidates", health.invalid],
              ["Not applicable", health.notApplicable],
              ["Rolled maturities", health.rolled],
            ].map(([label, value]) => <div key={String(label)} className="flex justify-between py-2.5"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono font-medium">{value}</dd></div>)}
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className={cn("border p-2", decreaseShare > 0.8 && "border-amber-500/40 bg-amber-500/5")}>
              <p className="text-muted-foreground">Decrease calls</p>
              <p className="mt-1 font-mono text-base">{formatPercent(decreaseShare)}</p>
            </div>
            <div className={cn("border p-2", flaggedRuns > 0 && "border-amber-500/40 bg-amber-500/5")}>
              <p className="text-muted-foreground">Quality-flagged runs</p>
              <p className="mt-1 font-mono text-base">{flaggedRuns}</p>
            </div>
          </div>
          <div className={cn("mt-4 border-l-2 px-3 py-2 text-sm", interval && interval.low > 0 ? "border-emerald-500 bg-emerald-500/5" : "border-amber-500 bg-amber-500/5")}>
            {interval ? `Approximate date-clustered 95% lift interval: ${formatVol(interval.low)} to ${formatVol(interval.high)}.` : "At least two independent market dates are needed for an uncertainty interval."}
          </div>
        </div>
      </section>

      <section className="border">
        <div className="border-b px-4 py-3"><h2 className="text-base font-semibold">Declared signal-life consistency</h2><p className="text-sm text-muted-foreground">Short-window overlay comparison, not long-tenor forecast accuracy</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Metric label="Independent runs" value={String(uniqueCount(filteredSignal, (row) => row.llm_validation_run_id ?? row.id))} hint={`${filteredSignal.length} correlated tenor rows`} />
          <Metric label="LLM outperformed" value={filteredSignal.length ? formatPercent(filteredSignal.filter((row) => row.llm_outperformed_quant ?? row.signal_still_valid).length / filteredSignal.length) : "--"} hint="Equal or lower error than quant" />
          <Metric label="Mean lift" value={filteredSignal.length ? formatVol(average(filteredSignal.map((row) => row.llm_lift))) : "--"} hint="During declared signal life" />
          <Metric label="Memory reads" value={filteredSignal.length ? average(filteredSignal.map((row) => row.memory_item_count)).toFixed(1) : "--"} hint="Prior validations used per row" />
        </div>
      </section>

      <section className="border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"><div><h2 className="text-base font-semibold">Memory A/B collection</h2><p className="text-sm text-muted-foreground">Same snapshot, model, and frozen research brief; only memory changes</p></div><span className="font-mono text-xs">{completePairs} complete pairs · {experimentIds} experiments</span></div>
        {experimentRuns.length === 0 ? <p className="px-4 py-8 text-sm text-muted-foreground">The paired experiment begins after the new Prefect deployment is applied.</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Experiment</TableHead><TableHead>Pair</TableHead><TableHead>Variant</TableHead><TableHead>As of</TableHead><TableHead>Adjustment</TableHead><TableHead>Brief hash</TableHead></TableRow></TableHeader><TableBody>{experimentRuns.slice(0, 20).map((run) => <TableRow key={run.id}><TableCell className="font-mono text-xs">{run.experiment_id}</TableCell><TableCell className="font-mono">{run.pair_code}</TableCell><TableCell>{run.experiment_variant}</TableCell><TableCell>{run.as_of_date}</TableCell><TableCell className="font-mono">{formatPercent(run.trend_adjustment_pct ?? 0)}</TableCell><TableCell className="max-w-[160px] truncate font-mono text-xs">{run.research_brief_hash}</TableCell></TableRow>)}</TableBody></Table></div>}
      </section>

      <section className="border">
        <div className="border-b px-4 py-3"><h2 className="text-base font-semibold">Matured outcome tape</h2><p className="text-sm text-muted-foreground">Newest canonical outcomes under the selected method</p></div>
        <div className="overflow-x-auto"><Table className="min-w-[1080px]"><TableHeader><TableRow><TableHead>Pair</TableHead><TableHead>Tenor</TableHead><TableHead>Declared</TableHead><TableHead>Evaluated</TableHead><TableHead className="text-right">Quant</TableHead><TableHead className="text-right">LLM</TableHead><TableHead className="text-right">Realized</TableHead><TableHead className="text-right">Lift</TableHead><TableHead>Direction</TableHead></TableRow></TableHeader><TableBody>{filtered.slice().sort((a, b) => b.maturity_date.localeCompare(a.maturity_date)).slice(0, 40).map((row) => <TableRow key={`${row.id}:${row.benchmark_method_version}`}><TableCell className="font-mono">{row.pair_code}</TableCell><TableCell>{TENOR_LABELS[row.tenor_key]}</TableCell><TableCell>{row.maturity_date}</TableCell><TableCell>{row.evaluation_market_date ?? row.maturity_date}{row.maturity_rolled ? " · rolled" : ""}</TableCell><TableCell className="text-right font-mono">{formatVol(row.quant_implied_vol)}</TableCell><TableCell className="text-right font-mono">{formatVol(row.llm_implied_vol)}</TableCell><TableCell className="text-right font-mono">{formatVol(row.realized_vol)}</TableCell><TableCell className={cn("text-right font-mono", row.llm_lift >= 0 ? "text-emerald-500" : "text-red-500")}>{formatVol(row.llm_lift)}</TableCell><TableCell>{row.llm_direction}</TableCell></TableRow>)}</TableBody></Table></div>
      </section>
    </div>
  );
}
