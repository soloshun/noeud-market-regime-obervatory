"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMultiplier, formatNumber } from "@/lib/format";
import { REGIME_TONES } from "@/lib/regime";
import {
  REGIME_LABELS,
  type RegimeHistoryPoint,
  type RegimeLabel,
  type RegimeSnapshot,
  type TrendAwareMultiplierMap,
  type ValidationRun,
} from "@/lib/types";
import {
  MULTIPLIER_CEILING,
  MULTIPLIER_FLOOR,
} from "@/lib/mock/engine";

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
}

function tooltipColor(item: unknown) {
  if (item && typeof item === "object" && "color" in item && typeof item.color === "string") {
    return item.color;
  }
  return "var(--muted-foreground)";
}

const OVERVIEW_TREND_AWARE_SERIES = [
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
] as const satisfies readonly {
  key: keyof TrendAwareMultiplierMap;
  label: string;
  quantKey: string;
  llmKey: string;
  color: string;
}[];

function latestValidationByPairDate(validations: ValidationRun[]) {
  const byKey = new Map<string, ValidationRun>();
  for (const run of validations) {
    const key = `${run.pair_code}:${run.as_of_date}`;
    const existing = byKey.get(key);
    if (!existing || run.created_at > existing.created_at) byKey.set(key, run);
  }
  return byKey;
}

export function TrendAwareOverviewHistoryChart({
  histories,
  validations,
}: {
  histories: Record<string, RegimeHistoryPoint[]>;
  validations: ValidationRun[];
}) {
  const validationByPairDate = latestValidationByPairDate(validations);
  const pairs = React.useMemo(() => Object.keys(histories).sort(), [histories]);
  const defaultPair = pairs.includes("USDGHS") ? "USDGHS" : pairs[0] ?? "";
  const [selectedPair, setSelectedPair] = React.useState("USDGHS");
  const activePair = pairs.includes(selectedPair) ? selectedPair : defaultPair;
  const points = histories[activePair] ?? [];
  const data = points.map((point) => {
    const quant = point.dynamic_trend_aware_regime_multiplier;
    const llm = validationByPairDate.get(`${activePair}:${point.as_of_date}`)
      ?.result.llm_recommended_trend_aware_multipliers;
    const row: Record<string, string | number | null> = { date: point.as_of_date };
    for (const series of OVERVIEW_TREND_AWARE_SERIES) {
      row[series.quantKey] = quant[series.key];
      row[series.llmKey] = llm?.[series.key] ?? null;
    }
    return row;
  });
  const dot = data.length < 2 ? { r: 3 } : false;
  const chartConfig = Object.fromEntries(
    OVERVIEW_TREND_AWARE_SERIES.flatMap((series) => [
      [series.quantKey, { label: `Quant ${series.label}`, color: series.color }],
      [series.llmKey, { label: `LLM ${series.label}`, color: series.color }],
    ]),
  );
  const labels = Object.fromEntries(
    OVERVIEW_TREND_AWARE_SERIES.flatMap((series) => [
      [series.quantKey, `Quant ${series.label}`],
      [series.llmKey, `LLM ${series.label}`],
    ]),
  );

  return (
    <Card className="border-foreground/10 bg-card/95">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Rolling Trend-Aware Multiplier Path</CardTitle>
          <CardDescription>
            Pair-specific deterministic multipliers versus LLM recommendations through ≤180d
          </CardDescription>
        </div>
        {pairs.length > 0 && (
          <Select value={activePair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select pair" />
            </SelectTrigger>
            <SelectContent>
              {pairs.map((pair) => (
                <SelectItem key={pair} value={pair}>
                  {pair.slice(0, 3)}/{pair.slice(3)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[340px] w-full"
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
                  labelFormatter={(value) => shortDate(String(value))}
                  formatter={(value, name, item) => {
                    const key = String(name);
                    return (
                      <span className="flex w-full min-w-40 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: tooltipColor(item) }}
                        />
                        <span className="text-muted-foreground">
                          {labels[key] ?? key}
                        </span>
                        <span className="ml-auto font-mono font-medium text-foreground">
                          {formatMultiplier(Number(value))}
                        </span>
                      </span>
                    );
                  }}
                />
              }
            />
            {OVERVIEW_TREND_AWARE_SERIES.map((series) => (
              <Line
                key={series.quantKey}
                dataKey={series.quantKey}
                type="monotone"
                stroke={`var(--color-${series.quantKey})`}
                strokeWidth={2}
                dot={dot}
              />
            ))}
            {OVERVIEW_TREND_AWARE_SERIES.map((series) => (
              <Line
                key={series.llmKey}
                dataKey={series.llmKey}
                type="monotone"
                stroke={`var(--color-${series.llmKey})`}
                strokeWidth={2.2}
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

export function RegimeDistributionChart({ snapshots }: { snapshots: RegimeSnapshot[] }) {
  const data = REGIME_LABELS.map((regime) => ({
    regime,
    count: snapshots.filter((s) => s.current_volatility_readings.regime === regime).length,
    fill: REGIME_TONES[regime].hex,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Regime Distribution</CardTitle>
        <CardDescription>How the book splits across volatility regimes</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={{ count: { label: "Pairs" } }}
          className="aspect-auto h-[240px] w-full"
        >
          <BarChart accessibilityLayer data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="regime" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} fontSize={11} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" nameKey="regime" />} />
            <Bar dataKey="count" radius={6}>
              <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={11} />
              {data.map((d) => (
                <Cell key={d.regime} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AccelerationLeaderboard({ snapshots }: { snapshots: RegimeSnapshot[] }) {
  const data = [...snapshots]
    .sort(
      (a, b) =>
        b.current_volatility_readings.accel_vs_252d -
        a.current_volatility_readings.accel_vs_252d,
    )
    .slice(0, 10)
    .map((s) => ({
      pair: s.display_pair,
      accel: s.current_volatility_readings.accel_vs_252d,
      fill: REGIME_TONES[s.current_volatility_readings.regime as RegimeLabel].hex,
    }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Acceleration Leaderboard</CardTitle>
        <CardDescription>Top pairs by 30d / 252d volatility ratio</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={{ accel: { label: "Acceleration" } }}
          className="aspect-auto h-[240px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 28, left: 4, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="pair"
              tickLine={false}
              axisLine={false}
              width={72}
              fontSize={11}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="flex w-full items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item?.payload?.fill }}
                      />
                      <span className="text-muted-foreground">{item?.payload?.pair}</span>
                      <span className="ml-auto font-mono font-medium text-foreground">
                        {formatNumber(Number(value), 2)}x
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="accel" radius={5}>
              <LabelList
                dataKey="accel"
                position="right"
                className="fill-foreground"
                fontSize={11}
                formatter={(value) => `${formatNumber(Number(value), 2)}x`}
              />
              {data.map((d) => (
                <Cell key={d.pair} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
