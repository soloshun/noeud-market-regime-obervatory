"use client";

import * as React from "react";
import {
  CheckCircle2Icon,
  DatabaseIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatDateTime } from "@/lib/format";
import type { ProviderRun } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatusCell({ status }: { status: string }) {
  const ok = ["success", "succeeded", "skipped"].includes(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        ok
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
          : "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/25",
      )}
    >
      {ok ? <CheckCircle2Icon className="size-3" /> : <XCircleIcon className="size-3" />}
      {status}
    </span>
  );
}

function modeOf(run: ProviderRun): string {
  const detail = run.source_detail ?? {};
  if (!["success", "succeeded", "skipped"].includes(run.status)) {
    return String((detail as Record<string, unknown>).error ?? "—");
  }
  const mode = (detail as Record<string, unknown>).mode as string | undefined;
  const fetchMode = (detail as Record<string, unknown>).fetch_mode as string | undefined;
  const backfill = (detail as Record<string, unknown>).backfill_reason as string | undefined;
  const label = mode ?? fetchMode ?? "—";
  return backfill ? `${label} · ${backfill}` : label;
}

export function DataHealthCards({ runs }: { runs: ProviderRun[] }) {
  const succeeded = runs.filter((r) =>
    ["success", "succeeded", "skipped"].includes(r.status),
  ).length;
  const failed = runs.length - succeeded;
  const rows = runs.reduce((a, r) => a + r.row_count, 0);
  const backfills = runs.filter(
    (r) => (r.source_detail as Record<string, unknown> | null)?.backfill_reason,
  ).length;

  const cards = [
    { label: "Provider Runs", value: runs.length, icon: DatabaseIcon, hint: "Across all pairs (recent window)" },
    { label: "Succeeded", value: succeeded, icon: CheckCircle2Icon, hint: `${failed} failed` },
    { label: "Rows Ingested", value: rows.toLocaleString(), icon: RefreshCwIcon, hint: "Normalized daily price rows" },
    { label: "Backfills", value: backfills, icon: RefreshCwIcon, hint: "Insufficient-history repairs" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <c.icon className="size-3.5" /> {c.label}
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{c.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{c.hint}</CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProviderRunsTable({ runs }: { runs: ProviderRun[] }) {
  const [pair, setPair] = React.useState<string>("ALL");
  const pairs = React.useMemo(
    () => Array.from(new Set(runs.map((r) => r.pair_code))).sort(),
    [runs],
  );
  const filtered = runs
    .filter((r) => pair === "ALL" || r.pair_code === pair)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Provider Runs</CardTitle>
          <CardDescription>yfinance ingestion runs · {filtered.length} shown</CardDescription>
        </div>
        <Select value={pair} onValueChange={setPair}>
          <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All pairs</SelectItem>
            {pairs.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-0">
        <div className="max-h-[560px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Pair</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="px-4">Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="px-4 font-mono font-medium">{r.pair_code}</TableCell>
                  <TableCell className="text-muted-foreground">{r.provider_name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.requested_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(r.completed_at)}</TableCell>
                  <TableCell><StatusCell status={r.status} /></TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{r.row_count}</TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">{modeOf(r)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
