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
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDate, formatMultiplier, formatNumber, formatRate, formatVol } from "@/lib/format";
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
  RawPriceObservation,
  TrendAwareMultiplierMap,
  ValidationRun,
} from "@/lib/types";

const VOL_WINDOWS: { key: keyof RegimeSnapshot["current_volatility_readings"]; label: string }[] = [
  { key: "vol_7d", label: "7d" },
  { key: "vol_30d", label: "30d" },
  { key: "vol_60d", label: "60d" },
  { key: "vol_90d", label: "90d" },
  { key: "vol_180d", label: "180d" },
  { key: "vol_252d", label: "252d" },
];

const TREND_AWARE_SERIES = [
  {
    key: "tenor_le_14d",
    label: "≤14d",
    quantKey: "quant14",
    llmKey: "llm14",
    color: "#f97316",
  },
  {
    key: "tenor_le_30d",
    label: "≤30d",
    quantKey: "quant30",
    llmKey: "llm30",
    color: "#eab308",
  },
  {
    key: "tenor_le_60d",
    label: "≤60d",
    quantKey: "quant60",
    llmKey: "llm60",
    color: "#22c55e",
  },
  {
    key: "tenor_le_90d",
    label: "≤90d",
    quantKey: "quant90",
    llmKey: "llm90",
    color: "#06b6d4",
  },
  {
    key: "tenor_le_180d",
    label: "≤180d",
    quantKey: "quant180",
    llmKey: "llm180",
    color: "#8b5cf6",
  },
  {
    key: "tenor_gt_180d",
    label: ">180d",
    quantKey: "quantLong",
    llmKey: "llmLong",
    color: "#f43f5e",
  },
] as const satisfies readonly {
  key: keyof TrendAwareMultiplierMap;
  label: string;
  quantKey: string;
  llmKey: string;
  color: string;
}[];

const TERM_STRUCTURE_HISTORY_SERIES = [
  {
    key: "tenor_le_7d",
    dataKey: "tenor7",
    label: "≤7d",
    color: "#60a5fa",
  },
  {
    key: "tenor_le_30d",
    dataKey: "tenor30",
    label: "≤30d",
    color: "#22c55e",
  },
  {
    key: "tenor_le_60d",
    dataKey: "tenor60",
    label: "≤60d",
    color: "#eab308",
  },
  {
    key: "tenor_le_90d",
    dataKey: "tenor90",
    label: "≤90d",
    color: "#f97316",
  },
  {
    key: "tenor_le_180d",
    dataKey: "tenor180",
    label: "≤180d",
    color: "#8b5cf6",
  },
  {
    key: "tenor_gt_180d",
    dataKey: "tenorLong",
    label: ">180d",
    color: "#f43f5e",
  },
] as const;

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function tooltipColor(item: unknown) {
  if (item && typeof item === "object" && "color" in item && typeof item.color === "string") {
    return item.color;
  }
  return "var(--muted-foreground)";
}

function legendTooltipFormatter(
  labels: Record<string, string>,
  formatter: (value: number, key: string) => string,
) {
  return function LegendTooltipFormatter(value: unknown, name: unknown, item: unknown) {
    const key = String(name);
    return (
      <span className="flex w-full min-w-40 items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: tooltipColor(item) }}
        />
        <span className="text-muted-foreground">{labels[key] ?? key}</span>
        <span className="ml-auto font-mono font-medium text-foreground">
          {formatter(Number(value), key)}
        </span>
      </span>
    );
  };
}

export function SpotHistoryChart({
  observations,
  pair,
}: {
  observations: RawPriceObservation[];
  pair: string;
}) {
  const data = observations.map((p) => ({ date: p.observed_on, spot: p.close_display }));
  const single = data.length < 2;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spot Rate</CardTitle>
        <CardDescription>{pair} daily close · last {observations.length} observations</CardDescription>
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
            <Area dataKey="spot" type="monotone" stroke="var(--color-spot)" strokeWidth={2} fill="url(#spotFill)" dot={single ? { r: 3, fill: "var(--color-spot)" } : false} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const REGIME_BAND_LABELS: RegimeLabel[] = ["NORMAL", "ELEVATED", "STRESSED", "CRISIS"];

export function AccelerationHistoryChart({ history }: { history: RegimeHistoryPoint[] }) {
  const data = history.map((p) => ({ date: p.as_of_date, accel: p.acceleration_vs_252d }));
  const maxAccel = data.reduce((m, d) => Math.max(m, d.accel), 0);
  const yMax = Math.max(2.7, Math.ceil(maxAccel * 1.15 * 10) / 10);
  const single = data.length < 2;

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
          <LineChart data={data} margin={{ top: 8, right: 48, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={40} domain={[0, yMax]} fontSize={11} tickFormatter={(v) => `${formatNumber(Number(v), 1)}x`} />
            {REGIME_BREAKPOINTS.map((bp, i) => (
              <ReferenceLine
                key={bp}
                y={bp}
                stroke={REGIME_TONES[REGIME_BAND_LABELS[i]].hex}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: REGIME_BAND_LABELS[i],
                  position: "right",
                  fontSize: 9,
                  fill: REGIME_TONES[REGIME_BAND_LABELS[i]].hex,
                }}
              />
            ))}
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} formatter={(val) => `${formatNumber(Number(val), 2)}x`} />}
            />
            <Line
              dataKey="accel"
              type="monotone"
              stroke="var(--color-accel)"
              strokeWidth={2}
              dot={single ? { r: 4, fill: "var(--color-accel)" } : false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function VolatilityHistoryChart({ history }: { history: RegimeHistoryPoint[] }) {
  const data = history.map((p) => ({
    date: p.as_of_date,
    vol30: p.vol_30d,
    vol60: p.vol_60d,
    vol90: p.vol_90d,
    vol180: p.vol_180d,
    vol252: p.vol_252d,
  }));
  const dot = data.length < 2 ? { r: 3 } : false;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Realized Volatility Path</CardTitle>
        <CardDescription>30d, 60d, 90d, 180d, and 252d annualized vol used by the regime engine</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            vol30: { label: "30d", color: "var(--chart-1)" },
            vol60: { label: "60d", color: "var(--chart-2)" },
            vol90: { label: "90d", color: "var(--chart-3)" },
            vol180: { label: "180d", color: "var(--chart-4)" },
            vol252: { label: "252d", color: "var(--chart-5)" },
          }}
          className="aspect-auto h-[260px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 0)} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => shortDate(String(v))}
                  formatter={legendTooltipFormatter(
                    {
                      vol30: "30d",
                      vol60: "60d",
                      vol90: "90d",
                      vol180: "180d",
                      vol252: "252d",
                    },
                    (value) => formatVol(value),
                  )}
                />
              }
            />
            <Line dataKey="vol30" type="monotone" stroke="var(--color-vol30)" strokeWidth={2} dot={dot} />
            <Line dataKey="vol60" type="monotone" stroke="var(--color-vol60)" strokeWidth={2} dot={dot} />
            <Line dataKey="vol90" type="monotone" stroke="var(--color-vol90)" strokeWidth={2} dot={dot} />
            <Line dataKey="vol180" type="monotone" stroke="var(--color-vol180)" strokeWidth={2} dot={dot} />
            <Line dataKey="vol252" type="monotone" stroke="var(--color-vol252)" strokeWidth={2} dot={dot} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TailRiskHistoryChart({ history }: { history: RegimeHistoryPoint[] }) {
  const data = history.map((p) => ({
    date: p.as_of_date,
    var30: p.hist_var_99_30d,
    fatTail: p.fat_tail_ratio,
  }));
  const dot = data.length < 2 ? { r: 3 } : false;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tail-Risk Tape</CardTitle>
        <CardDescription>Historical 99% 30d VaR and fat-tail pressure over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            var30: { label: "Hist VaR 99% 30d", color: "var(--chart-5)" },
            fatTail: { label: "Fat-tail ratio", color: "var(--chart-3)" },
          }}
          className="aspect-auto h-[260px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis yAxisId="var" tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 0)} />
            <YAxis yAxisId="ratio" orientation="right" tickLine={false} axisLine={false} width={36} fontSize={11} tickFormatter={(v) => `${formatNumber(Number(v), 1)}x`} />
            <ReferenceLine yAxisId="ratio" y={1} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.45} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => shortDate(String(v))}
                  formatter={(val, name, item) =>
                    legendTooltipFormatter(
                      { var30: "Hist VaR 99% 30d", fatTail: "Fat-tail ratio" },
                      (value, key) =>
                        key === "fatTail"
                          ? `${formatNumber(value, 2)}x`
                          : formatVol(value, 2),
                    )(val, name, item)
                  }
                />
              }
            />
            <Line yAxisId="var" dataKey="var30" type="monotone" stroke="var(--color-var30)" strokeWidth={2} dot={dot} />
            <Line yAxisId="ratio" dataKey="fatTail" type="monotone" stroke="var(--color-fatTail)" strokeWidth={2} dot={dot} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function latestValidationByDate(validations: ValidationRun[]) {
  const byDate = new Map<string, ValidationRun>();
  for (const run of validations) {
    const existing = byDate.get(run.as_of_date);
    if (!existing || run.created_at > existing.created_at) {
      byDate.set(run.as_of_date, run);
    }
  }
  return byDate;
}

export function TrendAwareMultiplierHistoryChart({
  history,
  validations,
  pair,
}: {
  history: RegimeHistoryPoint[];
  validations: ValidationRun[];
  pair: string;
}) {
  const validationByDate = latestValidationByDate(validations);
  const data = history.map((point) => {
    const quant = point.dynamic_trend_aware_regime_multiplier;
    const llm = validationByDate.get(point.as_of_date)?.result
      .llm_recommended_trend_aware_multipliers;
    const row: Record<string, string | number | null> = {
      date: point.as_of_date,
    };
    for (const series of TREND_AWARE_SERIES) {
      row[series.quantKey] = quant[series.key];
      row[series.llmKey] = llm?.[series.key] ?? null;
    }
    return row;
  });
  const dot = data.length < 2 ? { r: 3 } : false;
  const chartConfig = Object.fromEntries(
    TREND_AWARE_SERIES.flatMap((series) => [
      [series.quantKey, { label: `Quant ${series.label}`, color: series.color }],
      [series.llmKey, { label: `LLM ${series.label}`, color: series.color }],
    ]),
  );
  const labels = Object.fromEntries(
    TREND_AWARE_SERIES.flatMap((series) => [
      [series.quantKey, `Quant ${series.label}`],
      [series.llmKey, `LLM ${series.label}`],
    ]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rolling Trend-Aware Multipliers</CardTitle>
        <CardDescription>
          {pair} deterministic path with LLM recommendation points when validations exist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[360px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={42} domain={[MULTIPLIER_FLOOR, MULTIPLIER_CEILING]} fontSize={11} tickFormatter={(v) => `${formatNumber(Number(v), 1)}x`} />
            <ReferenceLine y={MULTIPLIER_FLOOR} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={MULTIPLIER_CEILING} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => shortDate(String(v))}
                  formatter={legendTooltipFormatter(
                    labels,
                    (value) => formatMultiplier(value),
                  )}
                />
              }
            />
            {TREND_AWARE_SERIES.map((series) => (
              <Line
                key={series.quantKey}
                dataKey={series.quantKey}
                type="monotone"
                stroke={`var(--color-${series.quantKey})`}
                strokeWidth={2}
                dot={dot}
              />
            ))}
            {TREND_AWARE_SERIES.map((series) => (
              <Line
                key={series.llmKey}
                dataKey={series.llmKey}
                type="monotone"
                stroke={`var(--color-${series.llmKey})`}
                strokeWidth={2.25}
                strokeDasharray="5 4"
                connectNulls
                dot={{ r: 3, fill: `var(--color-${series.llmKey})` }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function SignalHorizonHistoryChart({
  validations,
  pair,
}: {
  validations: ValidationRun[];
  pair: string;
}) {
  const validationByDate = latestValidationByDate(validations);
  const data = [...validationByDate.values()]
    .sort((a, b) => a.as_of_date.localeCompare(b.as_of_date))
    .map((run) => ({
      date: run.as_of_date,
      horizon: run.result.expected_signal_horizon_days,
      memory: run.prior_validation_context.item_count,
      validUntil: run.result.expected_signal_valid_until,
    }));
  const dot = data.length < 2 ? { r: 3 } : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Signal Horizon & Memory</CardTitle>
        <CardDescription>
          {pair} predicted overlay life versus prior validation context used by the scorer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            horizon: { label: "Expected Horizon Days", color: "var(--chart-1)" },
            memory: { label: "Prior Reads Used", color: "var(--chart-2)" },
          }}
          className="aspect-auto h-[240px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={36} domain={[0, 14]} fontSize={11} tickFormatter={(v) => `${formatNumber(Number(v), 0)}d`} />
            <ReferenceLine y={7} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.35} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => shortDate(String(value))}
                  formatter={(value, name, item) => {
                    const labels: Record<string, string> = {
                      horizon: "Expected horizon",
                      memory: "Prior reads used",
                    };
                    const suffix = String(name) === "horizon" ? "d" : "";
                    return (
                      <span className="flex w-full min-w-44 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: tooltipColor(item) }}
                        />
                        <span className="text-muted-foreground">
                          {labels[String(name)] ?? String(name)}
                        </span>
                        <span className="ml-auto font-mono font-medium text-foreground">
                          {formatNumber(Number(value), 0)}
                          {suffix}
                        </span>
                      </span>
                    );
                  }}
                />
              }
            />
            <Line dataKey="horizon" type="monotone" stroke="var(--color-horizon)" strokeWidth={2.25} dot={dot} />
            <Line dataKey="memory" type="monotone" stroke="var(--color-memory)" strokeWidth={2} strokeDasharray="5 4" dot={dot} />
          </LineChart>
        </ChartContainer>
        {data.at(-1) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Latest read is valid until {formatDate(data.at(-1)!.validUntil)} with{" "}
            {data.at(-1)!.memory} prior validation
            {data.at(-1)!.memory === 1 ? "" : "s"} in context.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TermStructureHistoryChart({ history }: { history: RegimeHistoryPoint[] }) {
  const data = history.map((point) => ({
    date: point.as_of_date,
    tenor7: point.volatility_term_structure.tenor_le_7d,
    tenor30: point.volatility_term_structure.tenor_le_30d,
    tenor60: point.volatility_term_structure.tenor_le_60d,
    tenor90: point.volatility_term_structure.tenor_le_90d,
    tenor180: point.volatility_term_structure.tenor_le_180d,
    tenorLong: point.volatility_term_structure.tenor_gt_180d,
  }));
  const dot = data.length < 2 ? { r: 3 } : false;
  const chartConfig = Object.fromEntries(
    TERM_STRUCTURE_HISTORY_SERIES.map((series) => [
      series.dataKey,
      { label: series.label, color: series.color },
    ]),
  );
  const labels = Object.fromEntries(
    TERM_STRUCTURE_HISTORY_SERIES.map((series) => [series.dataKey, series.label]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rolling Volatility Term Structure</CardTitle>
        <CardDescription>Tenor-matched annualized volatility path across hedge horizons</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} fontSize={11} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => formatVol(Number(v), 0)} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => shortDate(String(v))}
                  formatter={legendTooltipFormatter(
                    labels,
                    (value) => formatVol(value),
                  )}
                />
              }
            />
            {TERM_STRUCTURE_HISTORY_SERIES.map((series) => (
              <Line
                key={series.dataKey}
                dataKey={series.dataKey}
                type="monotone"
                stroke={`var(--color-${series.dataKey})`}
                strokeWidth={2}
                dot={dot}
              />
            ))}
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

export function TrendAwareMultiplierOverlayChart({
  snapshot,
  validation,
}: {
  snapshot: RegimeSnapshot;
  validation?: ValidationRun;
}) {
  const deterministic = snapshot.dynamic_trend_aware_regime_multiplier;
  const recommended = validation?.result.llm_recommended_trend_aware_multipliers;
  const data = MULTIPLIER_BUCKETS.map((bucket) => ({
    tenor: bucket.label,
    deterministic: deterministic[bucket.key as keyof typeof deterministic] as number,
    recommended:
      recommended?.[bucket.key as keyof typeof recommended] ??
      (deterministic[bucket.key as keyof typeof deterministic] as number),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend-Aware Multiplier Overlay</CardTitle>
        <CardDescription>
          Deterministic engine multipliers versus LLM sentiment-adjusted recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            deterministic: { label: "Deterministic", color: "var(--chart-3)" },
            recommended: { label: "LLM Recommended", color: "var(--chart-1)" },
          }}
          className="aspect-auto h-[280px] w-full"
        >
          <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="tenor" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={42}
              domain={[MULTIPLIER_FLOOR, MULTIPLIER_CEILING]}
              fontSize={11}
              tickFormatter={(value) => `${formatNumber(Number(value), 1)}x`}
            />
            <ReferenceLine y={MULTIPLIER_FLOOR} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={MULTIPLIER_CEILING} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={legendTooltipFormatter(
                    { deterministic: "Quant", recommended: "LLM" },
                    (value) => formatMultiplier(value),
                  )}
                />
              }
            />
            <Line
              dataKey="deterministic"
              type="monotone"
              stroke="var(--color-deterministic)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-deterministic)" }}
            />
            <Line
              dataKey="recommended"
              type="monotone"
              stroke="var(--color-recommended)"
              strokeWidth={2}
              strokeDasharray={validation ? undefined : "4 4"}
              dot={{ r: 3, fill: "var(--color-recommended)" }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
