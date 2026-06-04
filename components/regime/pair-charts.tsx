"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber, formatRate, formatVol } from "@/lib/format";
import { MULTIPLIER_BUCKETS, REGIME_TONES, TENOR_BUCKETS } from "@/lib/regime";
import {
  REGIME_BREAKPOINTS,
  MULTIPLIER_CEILING,
  MULTIPLIER_FLOOR,
} from "@/lib/mock/engine";
import type {
  RegimeHistoryPoint,
  RegimeLabel,
  RegimeSnapshot,
} from "@/lib/types";

const VOL_WINDOWS: { key: keyof RegimeSnapshot["current_volatility_readings"]; label: string }[] = [
  { key: "vol_7d", label: "7d" },
  { key: "vol_30d", label: "30d" },
  { key: "vol_60d", label: "60d" },
  { key: "vol_90d", label: "90d" },
  { key: "vol_180d", label: "180d" },
  { key: "vol_252d", label: "252d" },
];

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export function SpotHistoryChart({
  history,
  pair,
}: {
  history: RegimeHistoryPoint[];
  pair: string;
}) {
  const data = history.map((p) => ({ date: p.as_of_date, spot: p.spot_rate }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spot Rate</CardTitle>
        <CardDescription>{pair} daily close · last {history.length} sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ spot: { label: "Spot", color: "var(--chart-1)" } }}
          className="aspect-auto h-[240px] w-full"
        >
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="spotFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-spot)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-spot)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={56} domain={["auto", "auto"]} fontSize={11} tickFormatter={(v) => formatRate(Number(v))} />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} formatter={(val) => formatRate(Number(val))} />}
            />
            <Area dataKey="spot" type="monotone" stroke="var(--color-spot)" strokeWidth={2} fill="url(#spotFill)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AccelerationHistoryChart({ history }: { history: RegimeHistoryPoint[] }) {
  const data = history.map((p) => ({ date: p.as_of_date, accel: p.acceleration_vs_252d }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regime Acceleration</CardTitle>
        <CardDescription>30d / 252d volatility ratio with regime band thresholds</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ accel: { label: "Acceleration", color: "var(--chart-4)" } }}
          className="aspect-auto h-[240px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={40} domain={[0, "auto"]} fontSize={11} tickFormatter={(v) => `${formatNumber(Number(v), 1)}x`} />
            {REGIME_BREAKPOINTS.map((bp, i) => (
              <ReferenceLine
                key={bp}
                y={bp}
                stroke={REGIME_TONES[(["NORMAL", "ELEVATED", "STRESSED", "CRISIS"] as RegimeLabel[])[i]].hex}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            ))}
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} formatter={(val) => `${formatNumber(Number(val), 2)}x`} />}
            />
            <Line dataKey="accel" type="monotone" stroke="var(--color-accel)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TermStructureChart({ snapshot }: { snapshot: RegimeSnapshot }) {
  const ts = snapshot.volatility_term_structure;
  const data = TENOR_BUCKETS.map((b) => ({
    tenor: b.label,
    vol: ts[b.key as keyof typeof ts] as number,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volatility Term Structure</CardTitle>
        <CardDescription>Tenor-matched annualized volatility across buckets</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ vol: { label: "Annualized Vol", color: "var(--chart-2)" } }}
          className="aspect-auto h-[220px] w-full"
        >
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="tsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-vol)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-vol)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="tenor" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 0)} />
            <ChartTooltip content={<ChartTooltipContent formatter={(val) => formatVol(Number(val))} />} />
            <Area dataKey="vol" type="monotone" stroke="var(--color-vol)" strokeWidth={2} fill="url(#tsFill)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function VolWindowsChart({ snapshot }: { snapshot: RegimeSnapshot }) {
  const v = snapshot.current_volatility_readings;
  const data = VOL_WINDOWS.map((w) => ({ window: w.label, vol: v[w.key] as number }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volatility Readings</CardTitle>
        <CardDescription>Current annualized volatility by lookback window</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ vol: { label: "Vol", color: "var(--chart-1)" } }}
          className="aspect-auto h-[220px] w-full"
        >
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="window" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 0)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(val) => formatVol(Number(val))} />} />
            <Bar dataKey="vol" fill="var(--color-vol)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function MultiplierChart({ snapshot }: { snapshot: RegimeSnapshot }) {
  const m = snapshot.dynamic_trend_aware_regime_multiplier;
  const data = MULTIPLIER_BUCKETS.map((b) => ({
    tenor: b.label,
    multiplier: m[b.key as keyof typeof m] as number,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend-Aware Regime Multipliers</CardTitle>
        <CardDescription>
          Bounded [{MULTIPLIER_FLOOR.toFixed(1)}x, {MULTIPLIER_CEILING.toFixed(1)}x] tenor multipliers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ multiplier: { label: "Multiplier", color: "var(--chart-3)" } }}
          className="aspect-auto h-[220px] w-full"
        >
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="tenor" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={36} domain={[0, MULTIPLIER_CEILING]} fontSize={11} tickFormatter={(v) => `${formatNumber(Number(v), 1)}x`} />
            <ReferenceLine y={MULTIPLIER_FLOOR} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={MULTIPLIER_CEILING} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(val) => `${formatNumber(Number(val), 2)}x`} />} />
            <Bar dataKey="multiplier" radius={5}>
              {data.map((d) => (
                <Cell key={d.tenor} fill="var(--color-multiplier)" />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
