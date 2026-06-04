import { cn } from "@/lib/utils";
import {
  ACTION_LABELS,
  ACTION_TONES,
  BACKTEST_TONES,
  COMPOSITE_TONES,
  regimeTone,
  TREND_TONES,
  VALIDATION_STATUS_LABELS,
  VALIDATION_STATUS_TONES,
} from "@/lib/regime";
import { titleCase } from "@/lib/format";
import type {
  BacktestStatus,
  CompositeSignal,
  RecommendedAction,
  TrendSignal,
  ValidationStatus,
} from "@/lib/types";

const base =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function RegimeBadge({
  regime,
  score,
  className,
}: {
  regime: string;
  score?: number;
  className?: string;
}) {
  const tone = regimeTone(regime);
  return (
    <span className={cn(base, tone.badge, className)}>
      <span className={cn("size-1.5 rounded-full", tone.dot)} />
      {regime}
      {score != null && <span className="opacity-60">· {score}</span>}
    </span>
  );
}

export function SignalBadge({
  signal,
  className,
}: {
  signal: TrendSignal | CompositeSignal;
  className?: string;
}) {
  const tone =
    signal in COMPOSITE_TONES
      ? COMPOSITE_TONES[signal as CompositeSignal]
      : TREND_TONES[signal as TrendSignal];
  return <span className={cn(base, tone, className)}>{titleCase(signal)}</span>;
}

export function BacktestBadge({ status }: { status: BacktestStatus }) {
  return <span className={cn(base, BACKTEST_TONES[status])}>{status}</span>;
}

export function ValidationStatusBadge({ status }: { status: ValidationStatus }) {
  return (
    <span className={cn(base, VALIDATION_STATUS_TONES[status])}>
      {VALIDATION_STATUS_LABELS[status]}
    </span>
  );
}

export function ActionBadge({ action }: { action: RecommendedAction }) {
  return <span className={cn(base, ACTION_TONES[action])}>{ACTION_LABELS[action]}</span>;
}

export function BoolPill({ value, label }: { value: boolean; label: string }) {
  return (
    <span
      className={cn(
        base,
        value
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
          : "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/25",
      )}
    >
      <span className={cn("size-1.5 rounded-full", value ? "bg-emerald-500" : "bg-red-600")} />
      {label}
    </span>
  );
}
