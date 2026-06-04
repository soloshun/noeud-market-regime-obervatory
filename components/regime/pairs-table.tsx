"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchIcon } from "lucide-react";

import { RegimeBadge, SignalBadge } from "@/components/regime/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { formatRate, formatSignedPercent, formatVol } from "@/lib/format";
import { REGIME_LABELS, type RegimeSnapshot } from "@/lib/types";
import { useObservatoryStore } from "@/store/observatory-store";
import { cn } from "@/lib/utils";

type Row = {
  pair: string;
  display: string;
  base: string;
  quote: string;
  regime: string;
  regimeScore: number;
  spot: number | null;
  dayChangePct: number | null;
  accel: number;
  vol30: number;
  vol252: number;
  composite: RegimeSnapshot["volatility_trend_signals"]["composite_signal"];
  var30: number;
  backtest: string;
};

function toRow(s: RegimeSnapshot): Row {
  return {
    pair: s.pair,
    display: s.display_pair,
    base: s.pair.slice(0, 3),
    quote: s.pair.slice(3),
    regime: s.current_volatility_readings.regime,
    regimeScore: s.current_volatility_readings.regime_score,
    spot: s.live_spot_rates.spot_rate,
    dayChangePct: s.live_spot_rates.day_change_pct,
    accel: s.current_volatility_readings.accel_vs_252d,
    vol30: s.current_volatility_readings.vol_30d,
    vol252: s.current_volatility_readings.vol_252d,
    composite: s.volatility_trend_signals.composite_signal,
    var30: s.historical_var.hist_var_99_30day,
    backtest: s.backtest_validation_results.system_status,
  };
}

function SortHeader({
  label,
  onClick,
  sorted,
  align = "right",
}: {
  label: string;
  onClick: (event?: unknown) => void;
  sorted: false | "asc" | "desc";
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-xs font-medium hover:text-foreground",
        align === "right" ? "ml-auto" : "",
      )}
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

export function PairsTable({ snapshots }: { snapshots: RegimeSnapshot[] }) {
  const router = useRouter();
  const { regimeFilter, baseFilter, quoteFilter, search, setRegimeFilter, setBaseFilter, setQuoteFilter, setSearch } =
    useObservatoryStore();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "accel", desc: true }]);

  const bases = React.useMemo(
    () => Array.from(new Set(snapshots.map((s) => s.pair.slice(0, 3)))).sort(),
    [snapshots],
  );
  const quotes = React.useMemo(
    () => Array.from(new Set(snapshots.map((s) => s.pair.slice(3)))).sort(),
    [snapshots],
  );

  const rows = React.useMemo(() => {
    const term = search.trim().toUpperCase();
    return snapshots
      .map(toRow)
      .filter((r) => regimeFilter === "ALL" || r.regime === regimeFilter)
      .filter((r) => baseFilter === "ALL" || r.base === baseFilter)
      .filter((r) => quoteFilter === "ALL" || r.quote === quoteFilter)
      .filter((r) => !term || r.pair.includes(term));
  }, [snapshots, regimeFilter, baseFilter, quoteFilter, search]);

  const num = (v: number | null | undefined) => (v == null ? -Infinity : v);

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "display",
        header: ({ column }) => (
          <SortHeader label="Pair" align="left" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />
        ),
        cell: ({ row }) => <span className="font-mono font-medium">{row.original.display}</span>,
      },
      {
        accessorKey: "regime",
        header: ({ column }) => (
          <SortHeader label="Regime" align="left" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />
        ),
        sortingFn: (a, b) => a.original.regimeScore - b.original.regimeScore,
        cell: ({ row }) => <RegimeBadge regime={row.original.regime} score={row.original.regimeScore} />,
      },
      {
        accessorKey: "spot",
        header: ({ column }) => <SortHeader label="Spot" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        sortingFn: (a, b) => num(a.original.spot) - num(b.original.spot),
        cell: ({ row }) => <div className="text-right font-mono tabular-nums">{formatRate(row.original.spot)}</div>,
      },
      {
        accessorKey: "dayChangePct",
        header: ({ column }) => <SortHeader label="Day Δ" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        sortingFn: (a, b) => num(a.original.dayChangePct) - num(b.original.dayChangePct),
        cell: ({ row }) => {
          const v = row.original.dayChangePct;
          return (
            <div
              className={cn(
                "text-right font-mono tabular-nums",
                v != null && v > 0 && "text-emerald-600 dark:text-emerald-400",
                v != null && v < 0 && "text-red-600 dark:text-red-400",
              )}
            >
              {formatSignedPercent(v)}
            </div>
          );
        },
      },
      {
        accessorKey: "accel",
        header: ({ column }) => <SortHeader label="Accel" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <div className="text-right font-mono tabular-nums">{row.original.accel.toFixed(2)}x</div>,
      },
      {
        accessorKey: "vol30",
        header: ({ column }) => <SortHeader label="Vol 30d" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <div className="text-right font-mono tabular-nums">{formatVol(row.original.vol30)}</div>,
      },
      {
        accessorKey: "vol252",
        header: ({ column }) => <SortHeader label="Vol 252d" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums text-muted-foreground">{formatVol(row.original.vol252)}</div>
        ),
      },
      {
        accessorKey: "composite",
        header: () => <span className="text-xs font-medium">Signal</span>,
        enableSorting: false,
        cell: ({ row }) => <SignalBadge signal={row.original.composite} />,
      },
      {
        accessorKey: "var30",
        header: ({ column }) => <SortHeader label="VaR 30d" sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()!} />,
        cell: ({ row }) => <div className="text-right font-mono tabular-nums">{formatVol(row.original.var30, 2)}</div>,
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            All Pairs
            <span className="ml-2 text-sm font-normal text-muted-foreground">{rows.length} shown</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pair"
                className="h-8 w-36 pl-8"
              />
            </div>
            <Select value={regimeFilter} onValueChange={(v) => setRegimeFilter(v as typeof regimeFilter)}>
              <SelectTrigger size="sm" className="w-32"><SelectValue placeholder="Regime" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All regimes</SelectItem>
                {REGIME_LABELS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={baseFilter} onValueChange={(v) => setBaseFilter(v)}>
              <SelectTrigger size="sm" className="w-24"><SelectValue placeholder="Base" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All base</SelectItem>
                {bases.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={quoteFilter} onValueChange={(v) => setQuoteFilter(v)}>
              <SelectTrigger size="sm" className="w-24"><SelectValue placeholder="Quote" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All quote</SelectItem>
                {quotes.map((q) => (<SelectItem key={q} value={q}>{q}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No pairs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/pairs/${row.original.pair}`)}
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
      </CardContent>
    </Card>
  );
}
