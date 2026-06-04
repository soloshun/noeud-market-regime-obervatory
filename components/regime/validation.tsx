import Link from "next/link";
import { ExternalLinkIcon, SparklesIcon } from "lucide-react";

import { ActionBadge, RegimeBadge, ValidationStatusBadge } from "@/components/regime/badges";
import { Stat } from "@/components/regime/primitives";
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
import { formatDate, formatNumber, titleCase } from "@/lib/format";
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

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={value * 100} className="h-2 w-24" />
      <span className="font-mono text-xs tabular-nums">{formatNumber(value * 100, 0)}%</span>
    </div>
  );
}

/** Compact validation card — used on the pair detail page and the validation list. */
export function ValidationSummaryCard({
  run,
  href,
}: {
  run: ValidationRun;
  href?: string;
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
            </CardTitle>
            <CardDescription className="mt-1">
              {run.model_name} · {formatDate(run.as_of_date)}
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
            View full validation trace <ExternalLinkIcon className="size-3.5" />
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

export function ValidationDetail({ run }: { run: ValidationRun }) {
  const r = run.result;
  const brief = r.research_brief;

  return (
    <div className="space-y-4">
      <ValidationSummaryCard run={run} />

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
          <Accordion type="single" collapsible className="w-full">
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
