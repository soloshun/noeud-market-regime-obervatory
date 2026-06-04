"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";

import { ActionBadge, RegimeBadge, ValidationStatusBadge } from "@/components/regime/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import { VALIDATION_STATUS_LABELS, VALIDATION_STATUS_TONES } from "@/lib/regime";
import type { ValidationRun, ValidationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: ValidationStatus[] = [
  "supports",
  "partially_supports",
  "contradicts",
  "insufficient_evidence",
];

export function ValidationKpis({ runs }: { runs: ValidationRun[] }) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ValidationStatus, number>;
  for (const r of runs) counts[r.status] += 1;
  const escalations = runs.filter(
    (r) => r.result.recommended_action === "escalate_for_human_review",
  ).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {STATUSES.map((s) => (
        <Card key={s}>
          <CardHeader className="pb-2">
            <CardDescription>{VALIDATION_STATUS_LABELS[s]}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{counts[s]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("h-1.5 rounded-full", VALIDATION_STATUS_TONES[s].split(" ")[0])} />
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Escalations</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{escalations}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-1.5 rounded-full bg-red-600/40" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ValidationTable({ runs }: { runs: ValidationRun[] }) {
  const [status, setStatus] = React.useState<ValidationStatus | "ALL">("ALL");
  const [openRunId, setOpenRunId] = React.useState<string | null>(null);
  const filtered = runs.filter((r) => status === "ALL" || r.status === status);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Validation Runs</CardTitle>
          <CardDescription>Latest LLM validation per pair · {filtered.length} shown</CardDescription>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as ValidationStatus | "ALL")}>
          <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{VALIDATION_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Pair</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Det. Regime</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="px-4 text-right">As of</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <React.Fragment key={r.id}>
                <TableRow className="cursor-pointer" onClick={() => setOpenRunId(openRunId === r.id ? null : r.id)}>
                  <TableCell className="px-4 font-mono font-medium">
                    <div className="flex items-center gap-2">
                      <ChevronDownIcon
                        className={cn(
                          "size-3.5 text-muted-foreground transition-transform",
                          openRunId === r.id && "rotate-180",
                        )}
                      />
                      {r.result.display_pair}
                    </div>
                  </TableCell>
                  <TableCell><ValidationStatusBadge status={r.status} /></TableCell>
                  <TableCell><RegimeBadge regime={r.result.deterministic_regime} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={(r.confidence ?? 0) * 100} className="h-1.5 w-20" />
                      <span className="font-mono text-xs tabular-nums">{formatNumber((r.confidence ?? 0) * 100, 0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell><ActionBadge action={r.result.recommended_action} /></TableCell>
                  <TableCell className="px-4 text-right text-sm text-muted-foreground">{formatDate(r.as_of_date)}</TableCell>
                </TableRow>
                {openRunId === r.id && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="bg-muted/20 px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                        <div>
                          <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                            Aggregated verdict
                          </div>
                          <p className="text-sm leading-relaxed">{r.result.validation_summary}</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {r.result.rationale}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="text-muted-foreground">Research model</div>
                              <div className="mt-1 font-mono">{r.result.research_brief.retrieval_model}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Evidence</div>
                              <div className="mt-1 font-mono">
                                {r.result.research_brief.evidence.length} cited sources
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Scorers</div>
                              <div className="mt-1 font-mono">
                                {r.independent_scorer_results.length || 1} analyst views
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Run created</div>
                              <div className="mt-1 font-mono">{formatDate(r.created_at)}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {r.result.watch_items.slice(0, 3).map((item) => (
                              <span key={item} className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                                {item}
                              </span>
                            ))}
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/validation/${r.pair_code}`}>
                              Full trace
                              <ExternalLinkIcon className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
