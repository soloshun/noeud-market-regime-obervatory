"use client";

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
import { formatMultiplier, formatNumber } from "@/lib/format";
import { REGIME_TONES } from "@/lib/regime";
import {
  REGIME_LABELS,
  type RegimeHistoryPoint,
  type RegimeLabel,
  type RegimeSnapshot,
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

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

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
  const dates = Array.from(
    new Set(Object.values(histories).flatMap((points) => points.map((p) => p.as_of_date))),
  ).sort();
  const data = dates.map((date) => {
    const quantValues: number[] = [];
    const llmValues: number[] = [];
    for (const [pair, points] of Object.entries(histories)) {
      const point = points.find((item) => item.as_of_date === date);
      if (!point) continue;
      quantValues.push(
        point.dynamic_trend_aware_regime_multiplier.tenor_le_30d,
      );
      const llm = validationByPairDate.get(`${pair}:${date}`)?.result
        .llm_recommended_trend_aware_multipliers.tenor_le_30d;
      if (llm != null) llmValues.push(llm);
    }
    return {
      date,
      quant30: quantValues.length ? average(quantValues) : null,
      llm30: llmValues.length ? average(llmValues) : null,
    };
  });
  const dot = data.length < 2 ? { r: 3 } : false;

  return (
    <Card className="border-foreground/10 bg-card/95">
      <CardHeader>
        <CardTitle>Rolling Trend-Aware Multiplier Path</CardTitle>
        <CardDescription>
          Average 30d deterministic multiplier versus LLM recommendations across active pairs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            quant30: { label: "Quant 30d", color: "var(--chart-3)" },
            llm30: { label: "LLM 30d", color: "var(--chart-1)" },
          }}
          className="aspect-auto h-[300px] w-full"
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
                  formatter={(value, name) => (
                    <span className="flex w-full min-w-36 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {name === "quant30" ? "Quant 30d" : "LLM 30d"}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMultiplier(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Line dataKey="quant30" type="monotone" stroke="var(--color-quant30)" strokeWidth={2.25} dot={dot} />
            <Line dataKey="llm30" type="monotone" stroke="var(--color-llm30)" strokeWidth={2.25} strokeDasharray="5 4" connectNulls dot={{ r: 4, fill: "var(--color-llm30)" }} />
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
