/**
 * Visual + semantic language for regimes and signals.
 *
 * Regime bands mirror the deterministic engine constants:
 *   REGIME_BREAKPOINTS = (0.8, 1.2, 1.8, 2.5) on acceleration (vol_30d / vol_252d)
 *   REGIME_LABELS = CALM, NORMAL, ELEVATED, STRESSED, CRISIS
 *
 * Colors are expressed as Tailwind utility groups so badges/cells stay
 * consistent across the app and adapt to dark mode.
 */
import type {
  BacktestStatus,
  CompositeSignal,
  RecommendedAction,
  RegimeLabel,
  MarketSentiment,
  TrendSignal,
  TrendAdjustmentDirection,
  ValidationStatus,
  ValidationRunSource,
} from "@/lib/types";

type Tone = {
  /** badge / pill classes */
  badge: string;
  /** subtle surface for cells & accents */
  surface: string;
  /** solid dot / chart color */
  dot: string;
  /** raw chart hex (recharts needs a concrete color) */
  hex: string;
};

export const REGIME_TONES: Record<RegimeLabel, Tone> = {
  CALM: {
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    surface: "bg-emerald-500/10",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  NORMAL: {
    badge:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
    surface: "bg-sky-500/10",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  ELEVATED: {
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
    surface: "bg-amber-500/10",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  STRESSED: {
    badge:
      "bg-orange-600/15 text-orange-700 dark:text-orange-300 border-orange-600/25",
    surface: "bg-orange-600/10",
    dot: "bg-orange-600",
    hex: "#ea580c",
  },
  CRISIS: {
    badge:
      "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/25",
    surface: "bg-red-600/10",
    dot: "bg-red-600",
    hex: "#dc2626",
  },
};

export const REGIME_DESCRIPTIONS: Record<RegimeLabel, string> = {
  CALM: "Volatility well below its annual baseline. Quiet, low-stress conditions.",
  NORMAL: "Volatility broadly in line with its annual baseline.",
  ELEVATED: "Volatility accelerating above baseline. Conditions are shifting.",
  STRESSED: "Volatility materially above baseline. Heightened risk environment.",
  CRISIS: "Extreme acceleration versus the annual baseline. Crisis-level stress.",
};

export function regimeTone(regime: string): Tone {
  return REGIME_TONES[regime as RegimeLabel] ?? REGIME_TONES.NORMAL;
}

// --- Trend signals -------------------------------------------------------

export const TREND_TONES: Record<TrendSignal, string> = {
  RISING: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25",
  FLAT: "bg-muted text-muted-foreground border-border",
  FALLING:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
};

export const COMPOSITE_TONES: Record<CompositeSignal, string> = {
  STRONG_RISING:
    "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25",
  STRONG_FALLING:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  FLAT: "bg-muted text-muted-foreground border-border",
  MIXED_SIGNAL:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
};

// --- Backtest status -----------------------------------------------------

export const BACKTEST_TONES: Record<BacktestStatus, string> = {
  PASS: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  ACCEPTABLE:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  FAIL: "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/25",
};

// --- LLM validation ------------------------------------------------------

export const VALIDATION_STATUS_TONES: Record<ValidationStatus, string> = {
  supports:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  partially_supports:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
  contradicts:
    "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/25",
  insufficient_evidence:
    "bg-muted text-muted-foreground border-border",
};

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  supports: "Supports",
  partially_supports: "Partially Supports",
  contradicts: "Contradicts",
  insufficient_evidence: "Insufficient Evidence",
};

export const ACTION_TONES: Record<RecommendedAction, string> = {
  accept_deterministic_read:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  monitor_closely:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  escalate_for_human_review:
    "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/25",
  rerun_with_deeper_research:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
};

export const ACTION_LABELS: Record<RecommendedAction, string> = {
  accept_deterministic_read: "Accept Deterministic Read",
  monitor_closely: "Monitor Closely",
  escalate_for_human_review: "Escalate for Human Review",
  rerun_with_deeper_research: "Rerun With Deeper Research",
};

export const MARKET_SENTIMENT_LABELS: Record<MarketSentiment, string> = {
  volatility_dampening: "Volatility Dampening",
  volatility_amplifying: "Volatility Amplifying",
  mixed: "Mixed",
  unclear: "Unclear",
};

export const TREND_ADJUSTMENT_LABELS: Record<TrendAdjustmentDirection, string> = {
  increase: "Increase",
  decrease: "Decrease",
  hold: "Hold",
  insufficient_evidence: "Insufficient Evidence",
};

export const VALIDATION_RUN_SOURCE_LABELS: Record<ValidationRunSource, string> = {
  scheduled: "Scheduled",
  manual: "Manual",
  backfill: "Backfill",
  experiment: "Experiment",
  test: "Test",
  unknown: "Unknown",
};

/** Term-structure & multiplier tenor buckets, ordered for charts/tables. */
export const TENOR_BUCKETS = [
  { key: "tenor_le_7d", label: "≤7d" },
  { key: "tenor_le_30d", label: "≤30d" },
  { key: "tenor_le_60d", label: "≤60d" },
  { key: "tenor_le_90d", label: "≤90d" },
  { key: "tenor_le_180d", label: "≤180d" },
  { key: "tenor_gt_180d", label: ">180d" },
] as const;

export const MULTIPLIER_BUCKETS = [
  { key: "tenor_le_14d", label: "≤14d" },
  { key: "tenor_le_30d", label: "≤30d" },
  { key: "tenor_le_60d", label: "≤60d" },
  { key: "tenor_le_90d", label: "≤90d" },
  { key: "tenor_le_180d", label: "≤180d" },
  { key: "tenor_gt_180d", label: ">180d" },
] as const;
