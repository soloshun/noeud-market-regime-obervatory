"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";
import { REGIME_TONES } from "@/lib/regime";
import { REGIME_LABELS, type RegimeLabel, type RegimeSnapshot } from "@/lib/types";

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
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
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
                  hideIndicator
                  formatter={(value) => `${formatNumber(Number(value), 2)}x`}
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
