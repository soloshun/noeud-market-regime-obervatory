"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLinkIcon, SparklesIcon } from "lucide-react";

import { ActionBadge, RegimeBadge, ValidationStatusBadge } from "@/components/regime/badges";
import { EmptyState, Stat } from "@/components/regime/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime, formatMultiplier, formatNumber, titleCase } from "@/lib/format";
import {
  MARKET_SENTIMENT_LABELS,
  MULTIPLIER_BUCKETS,
  TREND_ADJUSTMENT_LABELS,
  VALIDATION_RUN_SOURCE_LABELS,
} from "@/lib/regime";
import { cn } from "@/lib/utils";
import type { ValidationResult, ValidationRun } from "@/lib/types";

/** Pretty-print a string if it is valid JSON, otherwise return it unchanged. */
function formatMaybeJson(raw: string): string {
  const trimmed = raw?.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return raw;
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return raw;
  }
}

export function TrendAwareAdjustmentCard({ run }: { run: ValidationRun }) {
  const r = run.result;
  const delta = r.recommended_primary_trend_multiplier - r.deterministic_primary_trend_multiplier;
  const positive = delta > 0;
  const neutral = Math.abs(delta) < 0.0001;
  const ladder = MULTIPLIER_BUCKETS.map((bucket) => {
    const deterministic = r.deterministic_trend_aware_multipliers[bucket.key];
    const recommended = r.llm_recommended_trend_aware_multipliers[bucket.key];
    const pct = deterministic === 0 ? 0 : recommended / deterministic - 1;
    return { ...bucket, deterministic, recommended, pct };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Trend-Aware Multiplier Ladder</CardTitle>
        <CardDescription>
          Quant engine versus LLM sentiment overlay across the full tenor strip
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Stat
            label="Deterministic"
            value={`${formatNumber(r.deterministic_primary_trend_multiplier, 2)}x`}
          />
          <Stat
            label="LLM recommendation"
            value={`${formatNumber(r.recommended_primary_trend_multiplier, 2)}x`}
          />
          <Stat
            label="Adjustment"
            value={`${positive ? "+" : ""}${formatNumber(r.trend_adjustment_pct * 100, 1)}%`}
          />
          <Stat
            label="Sentiment"
            value={MARKET_SENTIMENT_LABELS[r.market_sentiment]}
            mono={false}
          />
        </div>
        <div className="rounded-lg border bg-muted/25 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 font-medium",
                positive
                  ? "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
                  : neutral
                    ? "border-border bg-background text-muted-foreground"
                    : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {TREND_ADJUSTMENT_LABELS[r.trend_adjustment_direction]}
            </span>
            <span className="text-muted-foreground">
              {formatNumber(r.trend_adjustment_confidence * 100, 0)}% adjustment confidence
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {r.trend_adjustment_rationale}
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-3 font-mono text-[11px] uppercase tracking-wide">Tenor</TableHead>
                <TableHead className="px-3 text-right font-mono text-[11px] uppercase tracking-wide">Quant</TableHead>
                <TableHead className="px-3 text-right font-mono text-[11px] uppercase tracking-wide">LLM</TableHead>
                <TableHead className="px-3 text-right font-mono text-[11px] uppercase tracking-wide">Overlay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ladder.map((row) => {
                const rowPositive = row.pct > 0;
                const rowNeutral = Math.abs(row.pct) < 0.0001;
                return (
                  <TableRow
                    key={row.key}
                    className={cn(row.key === r.primary_trend_aware_tenor && "bg-muted/35")}
                  >
                    <TableCell className="px-3 py-2 font-mono text-xs">
                      {row.label}
                      {row.key === r.primary_trend_aware_tenor && (
                        <span className="ml-2 rounded border bg-background px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground">
                          primary
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                      {formatMultiplier(row.deterministic)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                      {formatMultiplier(row.recommended)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-3 py-2 text-right font-mono text-xs tabular-nums",
                        rowPositive && "text-red-600 dark:text-red-400",
                        !rowPositive && !rowNeutral && "text-emerald-600 dark:text-emerald-400",
                        rowNeutral && "text-muted-foreground",
                      )}
                    >
                      {rowPositive ? "+" : ""}
                      {formatNumber(row.pct * 100, 1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {r.trend_driver_evidence.length > 0 && (
          <PointList title="Trend drivers" points={r.trend_driver_evidence} tone="bg-sky-500" />
        )}
      </CardContent>
    </Card>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={value * 100} className="h-2 w-24" />
      <span className="font-mono text-xs tabular-nums">{formatNumber(value * 100, 0)}%</span>
    </div>
  );
}

/** Compact validation card — shows the latest run, used on the snapshot tab. */
export function ValidationSummaryCard({
  run,
  href,
  runCount = 1,
}: {
  run: ValidationRun;
  href?: string;
  runCount?: number;
}) {
  const r = run.result;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <SparklesIcon className="size-4 text-muted-foreground" />
              LLM Validation
              <span className="font-normal text-muted-foreground">· latest</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {VALIDATION_RUN_SOURCE_LABELS[run.run_source]} · {run.model_name} · {formatDateTime(run.created_at)}
            </CardDescription>
          </div>
          <ValidationStatusBadge status={r.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{r.validation_summary}</p>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Deterministic regime" value={<RegimeBadge regime={r.deterministic_regime} />} mono={false} />
          <Stat label="External context read" value={r.external_context_regime_read} mono={false} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <ConfidenceBar value={r.confidence} />
          </div>
          <Stat label="Recommended action" value={<ActionBadge action={r.recommended_action} />} mono={false} />
        </div>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {runCount > 1 ? `View all ${runCount} validation runs` : "View full validation trace"}
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function PointList({ title, points, tone }: { title: string; points: string[]; tone: string }) {
  if (points.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tone}`} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScorerRow({ result }: { result: ValidationResult }) {
  return (
    <TableRow>
      <TableCell className="px-6 font-mono text-xs">{result.scorer_model}</TableCell>
      <TableCell><ValidationStatusBadge status={result.status} /></TableCell>
      <TableCell className="px-6 text-right"><ConfidenceBar value={result.confidence} /></TableCell>
    </TableRow>
  );
}

function ValidationOutputLedger({ run }: { run: ValidationRun }) {
  const r = run.result;
  const rows = [
    ["Run source", VALIDATION_RUN_SOURCE_LABELS[run.run_source]],
    ["Status", titleCase(r.status)],
    ["Confidence", `${formatNumber(r.confidence * 100, 0)}%`],
    ["Deterministic regime", r.deterministic_regime],
    ["External context read", r.external_context_regime_read],
    ["Market sentiment", MARKET_SENTIMENT_LABELS[r.market_sentiment]],
    ["Trend adjustment", TREND_ADJUSTMENT_LABELS[r.trend_adjustment_direction]],
    ["Adjustment confidence", `${formatNumber(r.trend_adjustment_confidence * 100, 0)}%`],
    ["Recommended action", titleCase(r.recommended_action)],
    ["Scorer model", r.scorer_model],
    ["Prompt version", r.prompt_version],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">LLM Output Ledger</CardTitle>
        <CardDescription>Every first-class validation field captured from the JSON result</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="border-l pl-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-0.5 break-words font-mono text-xs font-medium">{value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Validation summary</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.validation_summary}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Trend-aware summary</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.trend_aware_validation_summary}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Adjustment rationale</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.trend_adjustment_rationale}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ValidationDetail({ run }: { run: ValidationRun }) {
  const r = run.result;
  const brief = r.research_brief;

  return (
    <div className="space-y-4">
      <ValidationSummaryCard run={run} />
      <TrendAwareAdjustmentCard run={run} />
      <ValidationOutputLedger run={run} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Analyst Rationale</CardTitle>
            <CardDescription>Aggregated verdict reasoning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{r.rationale}</p>
            <PointList title="Supporting points" points={r.supporting_points} tone="bg-emerald-500" />
            <PointList title="Contradicting points" points={r.contradicting_points} tone="bg-red-500" />
            <PointList title="Watch items" points={r.watch_items} tone="bg-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Research Brief</CardTitle>
            <CardDescription>Grounded context · {brief.retrieval_model}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Macro</span>
              <p className="mt-1 leading-relaxed text-muted-foreground">{brief.macro_context}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Central bank</span>
              <p className="mt-1 leading-relaxed text-muted-foreground">{brief.central_bank_context}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency-specific</span>
              <p className="mt-1 leading-relaxed text-muted-foreground">{brief.currency_specific_context}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market sentiment</span>
              <p className="mt-1 leading-relaxed text-muted-foreground">{brief.market_sentiment_summary}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy/liquidity</span>
              <p className="mt-1 leading-relaxed text-muted-foreground">{brief.policy_liquidity_context}</p>
            </div>
            {brief.risk_events.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risk events</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {brief.risk_events.map((e, i) => (
                    <span key={i} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs">{e}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {run.independent_scorer_results.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ensemble Scorers</CardTitle>
            <CardDescription>Independent views aggregated into the final verdict</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6">Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-6 text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.independent_scorer_results.map((res, i) => (
                  <ScorerRow key={i} result={res} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ensemble Scorers</CardTitle>
            <CardDescription>Independent views aggregated into the final verdict</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No ensemble run for this validation — a single scorer model produced the verdict
              shown above.
            </p>
          </CardContent>
        </Card>
      )}

      {brief.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Evidence</CardTitle>
            <CardDescription>Cited sources behind the research brief</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {brief.evidence.map((e, i) => (
              <div key={i} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div className="min-w-0">
                  <a href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium hover:underline">
                    <span className="truncate">{e.title}</span>
                    <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />
                  </a>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.excerpt}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{e.source}</span>
                    {e.published_at && <span>· {formatDate(e.published_at)}</span>}
                  </div>
                </div>
                <span className="shrink-0 rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-xs">
                  {formatNumber(e.relevance_score, 2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Raw Model Responses</CardTitle>
          <CardDescription>Full audit trace for every model call</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {run.raw_model_responses.map((call, i) => (
              <AccordionItem key={i} value={`call-${i}`}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="rounded border bg-muted/50 px-1.5 py-0.5 text-xs">{titleCase(call.call_role)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{call.model}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {call.reasoning_content && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reasoning</span>
                      <p className="mt-1 text-sm text-muted-foreground">{call.reasoning_content}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Raw content</span>
                    <pre className="mt-1 max-h-96 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {formatMaybeJson(call.raw_content)}
                    </pre>
                  </div>
                  {call.citations.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Citations ({call.citations.length})
                      </span>
                      <ul className="mt-1 space-y-1">
                        {call.citations.map((c, ci) => (
                          <li key={ci}>
                            <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                              {c.title || c.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Renders every validation run recorded for a pair. A pair can be validated
 * many times (re-runs, different models, different days), so this shows a run
 * selector when there is more than one, with the full trace for the selected run.
 */
export function PairValidations({
  runs,
  initialRunId,
}: {
  runs: ValidationRun[];
  initialRunId?: string | null;
}) {
  const ordered = React.useMemo(
    () => [...runs].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [runs],
  );
  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    initialRunId ?? ordered[0]?.id,
  );

  if (ordered.length === 0) {
    return (
      <EmptyState
        title="No validation run yet"
        description="No LLM validation has been recorded for this pair. Runs will appear here once the intelligence layer scores a snapshot."
      />
    );
  }

  const selected = ordered.find((r) => r.id === selectedId) ?? ordered[0];

  return (
    <div className="space-y-4">
      {ordered.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ordered.length} validation runs · newest first
          </p>
          <div className="flex flex-wrap gap-2">
            {ordered.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedId(run.id)}
                className={cn(
                  "flex min-w-[150px] flex-col gap-1.5 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40",
                  run.id === selected.id ? "border-primary bg-muted/40" : "border-border",
                )}
              >
                <span className="font-mono text-xs font-medium">
                  {formatDateTime(run.created_at)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {VALIDATION_RUN_SOURCE_LABELS[run.run_source]}
                </span>
                <span className="truncate text-xs text-muted-foreground">{run.model_name}</span>
                <ValidationStatusBadge status={run.status} />
              </button>
            ))}
          </div>
        </div>
      )}
      <ValidationDetail run={selected} />
    </div>
  );
}
