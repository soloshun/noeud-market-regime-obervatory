"use client";

import * as React from "react";
import Link from "next/link";

import { RegimeBadge } from "@/components/regime/badges";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRate, formatSignedPercent } from "@/lib/format";
import { regimeTone } from "@/lib/regime";
import { cn } from "@/lib/utils";
import type { RegimeSnapshot } from "@/lib/types";
import { SearchIcon } from "lucide-react";

export function PairGrid({ snapshots }: { snapshots: RegimeSnapshot[] }) {
  const [search, setSearch] = React.useState("");
  const term = search.trim().toUpperCase();
  const filtered = snapshots.filter((s) => !term || s.pair.includes(term));

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pair"
          className="h-9 pl-8"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((s) => {
          const v = s.current_volatility_readings;
          const tone = regimeTone(v.regime);
          const dc = s.live_spot_rates.day_change_pct;
          return (
            <Link key={s.pair} href={`/pairs/${s.pair}`}>
              <Card
                className="gap-0 border-l-4 p-4 transition-colors hover:bg-muted/40"
                style={{ borderLeftColor: tone.hex }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-semibold">{s.display_pair}</span>
                  <RegimeBadge regime={v.regime} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-lg font-semibold tabular-nums">
                      {formatRate(s.live_spot_rates.spot_rate)}
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
                    <div className="text-xs text-muted-foreground">Accel</div>
                    <div className="font-mono text-sm font-medium tabular-nums">
                      {v.accel_vs_252d.toFixed(2)}x
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
