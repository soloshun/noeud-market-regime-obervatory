"use client";

import * as React from "react";
import { CalendarClockIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPercent, formatVol } from "@/lib/format";
import { MULTIPLIER_BUCKETS, TREND_ADJUSTMENT_LABELS } from "@/lib/regime";
import type { BenchmarkResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function tenorLabel(tenor: string) {
  return MULTIPLIER_BUCKETS.find((bucket) => bucket.key === tenor)?.label ?? tenor;
}

function tenorRows(results: BenchmarkResult[]) {
  return MULTIPLIER_BUCKETS.map((bucket) => {
    const rows = results.filter((result) => result.tenor_key === bucket.key);
    return {
      tenor: bucket.label,
      quantError: average(rows.map((row) => row.quant_abs_error)),
      llmError: average(rows.map((row) => row.llm_abs_error)),
      lift: average(rows.map((row) => row.llm_lift)),
      count: rows.length,
    };
  }).filter((row) => row.count > 0);
}

function nextBenchmarkRun(now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(9, 0, 0, 0);
  const daysUntilSaturday = (6 - now.getUTCDay() + 7) % 7;
  next.setUTCDate(now.getUTCDate() + daysUntilSaturday);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 7);
  }
  return next;
}

function formatRunDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
    timeZoneName: "short",
  }).format(value);
}

export function PerformanceLab({ results }: { results: BenchmarkResult[] }) {
  const nextRun = React.useMemo(() => nextBenchmarkRun(), []);
  const sorted = React.useMemo(
    () => [...results].sort((a, b) => b.maturity_date.localeCompare(a.maturity_date)),
    [results],
  );
  const quantError = average(results.map((row) => row.quant_abs_error));
  const llmError = average(results.map((row) => row.llm_abs_error));
  const lift = quantError - llmError;
  const directionHitRate =
    results.filter((row) => row.direction_hit).length / Math.max(results.length, 1);
  const quantUndercoverage =
    results.filter((row) => row.quant_undercovered).length / Math.max(results.length, 1);
  const llmUndercoverage =
    results.filter((row) => row.llm_undercovered).length / Math.max(results.length, 1);
  const chartRows = tenorRows(results);

  return (
    <div className="space-y-4">
      <Card className="border-foreground/10 bg-card/95">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Benchmark Evaluation Schedule</CardTitle>
            <CardDescription>
              Prefect checks matured validation windows weekly and writes scored rows into the Performance Lab feed.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <CalendarClockIcon className="size-4 text-muted-foreground" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Next evaluation
              </div>
              <div className="font-mono text-sm font-medium tabular-nums">
                {formatRunDate(nextRun)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Matured Scores" value={`${results.length}`} hint="Validation-run tenor windows scored" />
        <Metric label="Quant Error" value={formatVol(quantError, 2)} hint="Mean absolute vol error" />
        <Metric label="LLM Error" value={formatVol(llmError, 2)} hint="Mean absolute vol error after overlay" />
        <Metric
          label="LLM Lift"
          value={`${lift >= 0 ? "+" : ""}${formatVol(lift, 2)}`}
          hint="Positive means LLM reduced error"
        />
        <Metric label="Direction Hit" value={formatPercent(directionHitRate, 0)} hint="Increase/decrease/hold calls that matured correctly" />
      </div>

      {results.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Waiting for Matured Windows</CardTitle>
            <CardDescription>
              Benchmark rows appear only after a validation run has enough future prices for a tenor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No tenor window has matured yet. The scheduled benchmark flow will keep checking stored validation runs and will publish the first scored rows automatically once enough future prices exist.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Error by Tenor</CardTitle>
                <CardDescription>Quant-only error versus LLM-adjusted error</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    quantError: { label: "Quant Error", color: "var(--chart-4)" },
                    llmError: { label: "LLM Error", color: "var(--chart-1)" },
                  }}
                  className="aspect-auto h-[280px] w-full"
                >
                  <BarChart data={chartRows} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="tenor" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 1)} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatVol(Number(value), 2)} />} />
                    <Bar dataKey="quantError" fill="var(--color-quantError)" radius={4} />
                    <Bar dataKey="llmError" fill="var(--color-llmError)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LLM Lift by Tenor</CardTitle>
                <CardDescription>Positive bars mean the LLM overlay beat quant-only</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ lift: { label: "LLM Lift", color: "var(--chart-2)" } }}
                  className="aspect-auto h-[280px] w-full"
                >
                  <BarChart data={chartRows} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="tenor" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 1)} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatVol(Number(value), 2)} />} />
                    <Bar dataKey="lift" radius={4}>
                      {chartRows.map((row) => (
                        <Cell
                          key={row.tenor}
                          fill={row.lift >= 0 ? "var(--chart-2)" : "var(--chart-5)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Metric label="Quant Undercoverage" value={formatPercent(quantUndercoverage, 0)} hint="Realized vol exceeded quant-implied vol" />
            <Metric label="LLM Undercoverage" value={formatPercent(llmUndercoverage, 0)} hint="Realized vol exceeded LLM-implied vol" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Matured Benchmark Tape</CardTitle>
              <CardDescription>Every scored validation-tenor outcome, newest maturity first</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[1160px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4">Pair</TableHead>
                      <TableHead>Tenor</TableHead>
                      <TableHead>Maturity</TableHead>
                      <TableHead className="text-right">Quant Imp Vol</TableHead>
                      <TableHead className="text-right">LLM Imp Vol</TableHead>
                      <TableHead className="text-right">Realized Vol</TableHead>
                      <TableHead className="text-right">Lift</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Hit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((row) => (
                      <TableRow key={`${row.llm_validation_run_id}-${row.tenor_key}`}>
                        <TableCell className="px-4 font-mono font-medium">{row.pair_code}</TableCell>
                        <TableCell className="font-mono">{tenorLabel(row.tenor_key)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(row.maturity_date)}</TableCell>
                        <TableCell className="text-right font-mono">{formatVol(row.quant_implied_vol, 1)}</TableCell>
                        <TableCell className="text-right font-mono">{formatVol(row.llm_implied_vol, 1)}</TableCell>
                        <TableCell className="text-right font-mono">{formatVol(row.realized_vol, 1)}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono",
                            row.llm_lift >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                          )}
                        >
                          {row.llm_lift >= 0 ? "+" : ""}
                          {formatVol(row.llm_lift, 2)}
                        </TableCell>
                        <TableCell>{TREND_ADJUSTMENT_LABELS[row.llm_direction]}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 text-xs",
                              row.direction_hit
                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
                            )}
                          >
                            {row.direction_hit ? "Hit" : "Miss"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
