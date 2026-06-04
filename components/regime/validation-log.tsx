"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { ActionBadge, RegimeBadge, ValidationStatusBadge } from "@/components/regime/badges";
import { TablePagination } from "@/components/regime/table-pagination";
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
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { VALIDATION_STATUS_LABELS, VALIDATION_STATUS_TONES } from "@/lib/regime";
import type { ValidationRun, ValidationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: ValidationStatus[] = [
  "supports",
  "partially_supports",
  "contradicts",
  "insufficient_evidence",
];

function SortHeader({
  label,
  onClick,
  sorted,
  align = "left",
}: {
  label: string;
  onClick: (event?: unknown) => void;
  sorted: false | "asc" | "desc";
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-1 text-xs font-medium hover:text-foreground", align === "right" && "ml-auto")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUpIcon className="size-3" />
      ) : sorted === "desc" ? (
        <ArrowDownIcon className="size-3" />
      ) : (
        <ArrowUpDownIcon className="size-3 opacity-40" />
      )}
    </button>
  );
}

export function ValidationKpis({ runs }: { runs: ValidationRun[] }) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ValidationStatus, number>;
  for (const r of runs) counts[r.status] = (counts[r.status] ?? 0) + 1;
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

export function ValidationLog({ runs }: { runs: ValidationRun[] }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ValidationStatus | "ALL">("ALL");
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }]);

  const data = React.useMemo(
    () => runs.filter((r) => status === "ALL" || r.status === status),
    [runs, status],
  );

  const columns = React.useMemo<ColumnDef<ValidationRun>[]>(
    () => [
      {
        accessorKey: "pair_code",
        header: ({ column }) => <SortHeader label="Pair" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <span className="font-mono font-medium">{row.original.result.display_pair}</span>,
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => <SortHeader label="Run at" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.created_at)}</span>,
      },
      {
        accessorKey: "as_of_date",
        header: ({ column }) => <SortHeader label="As of" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.as_of_date)}</span>,
      },
      {
        accessorKey: "model_name",
        header: () => <span className="text-xs font-medium">Model</span>,
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.model_name}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortHeader label="Status" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <ValidationStatusBadge status={row.original.status} />,
      },
      {
        id: "det_regime",
        header: () => <span className="text-xs font-medium">Det. Regime</span>,
        enableSorting: false,
        cell: ({ row }) => <RegimeBadge regime={row.original.result.deterministic_regime} />,
      },
      {
        accessorKey: "confidence",
        header: ({ column }) => <SortHeader label="Confidence" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={(row.original.confidence ?? 0) * 100} className="h-1.5 w-20" />
            <span className="font-mono text-xs tabular-nums">{formatNumber((row.original.confidence ?? 0) * 100, 0)}%</span>
          </div>
        ),
      },
      {
        id: "action",
        header: () => <span className="text-xs font-medium">Action</span>,
        enableSorting: false,
        cell: ({ row }) => <ActionBadge action={row.original.result.recommended_action} />,
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Validation Runs</CardTitle>
          <CardDescription>
            Every LLM validation run · each is tied to a currency pair · {data.length} shown
          </CardDescription>
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
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No validation runs found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/pairs/${row.original.pair_code}?tab=validation&run=${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination table={table} />
      </CardContent>
    </Card>
  );
}
