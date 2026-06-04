"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { RegimeBadge, SignalBadge } from "@/components/regime/badges";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRate, formatSignedPercent, formatVol } from "@/lib/format";
import { regimeTone } from "@/lib/regime";
import { cn } from "@/lib/utils";
import { REGIME_LABELS, type RegimeLabel, type RegimeSnapshot } from "@/lib/types";

type RegimeFilter = RegimeLabel | "ALL";

function PairTile({ snapshot }: { snapshot: RegimeSnapshot }) {
  const v = snapshot.current_volatility_readings;
  const tone = regimeTone(v.regime);
  const dc = snapshot.live_spot_rates.day_change_pct;
  const proximity = Math.min(v.accel_vs_252d / 2.5, 1) * 100;

  return (
    <Link
      href={`/pairs/${snapshot.pair}`}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
        tone.surface,
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: tone.hex }} />

      <div className="flex items-center justify-between">
        <span className="font-mono text-base font-semibold">{snapshot.display_pair}</span>
        <RegimeBadge regime={v.regime} score={v.regime_score} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xl font-semibold tabular-nums">
            {formatRate(snapshot.live_spot_rates.spot_rate)}
          </div>
          <div
            className={cn(
              "font-mono text-xs tabular-nums",
              dc != null && dc > 0 && "text-emerald-600 dark:text-emerald-400",
              dc != null && dc < 0 && "text-red-600 dark:text-red-400",
            )}
          >
            {formatSignedPercent(dc)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">Acceleration</div>
          <div className="font-mono text-sm font-medium tabular-nums">
            {v.accel_vs_252d.toFixed(2)}x
          </div>
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full"
          style={{ width: `${proximity}%`, backgroundColor: tone.hex }}
          title="Acceleration toward the crisis threshold (2.5×)"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Vol 30d <span className="font-mono text-foreground">{formatVol(v.vol_30d)}</span>
        </span>
        <SignalBadge signal={snapshot.volatility_trend_signals.composite_signal} />
      </div>
    </Link>
  );
}

export function PairGrid({ snapshots }: { snapshots: RegimeSnapshot[] }) {
  const [search, setSearch] = React.useState("");
  const [regime, setRegime] = React.useState<RegimeFilter>("ALL");
  const term = search.trim().toUpperCase();

  const filtered = snapshots
    .filter((s) => !term || s.pair.includes(term))
    .filter((s) => regime === "ALL" || s.current_volatility_readings.regime === regime)
    .sort((a, b) => {
      const av = a.current_volatility_readings;
      const bv = b.current_volatility_readings;
      return (
        bv.regime_score * 100 + bv.accel_vs_252d - (av.regime_score * 100 + av.accel_vs_252d)
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pair"
            className="h-9 pl-8"
          />
        </div>
        <Select value={regime} onValueChange={(v) => setRegime(v as RegimeFilter)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Regime" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All regimes</SelectItem>
            {REGIME_LABELS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No pairs match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <PairTile key={s.pair} snapshot={s} />
          ))}
        </div>
      )}
    </div>
  );
}
