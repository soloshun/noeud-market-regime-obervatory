"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ActionBadge, RegimeBadge, ValidationStatusBadge } from "@/components/regime/badges";
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
  const router = useRouter();
  const [status, setStatus] = React.useState<ValidationStatus | "ALL">("ALL");
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
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => router.push(`/validation/${r.pair_code}`)}
              >
                <TableCell className="px-4 font-mono font-medium">{r.result.display_pair}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
