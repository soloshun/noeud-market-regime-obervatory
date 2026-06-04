/**
 * A compact TypeScript port of the deterministic regime math from
 * `noeud-market-regime/src/.../calculations/market_regime.py`.
 *
 * It exists only to generate internally-consistent fixture data for the
 * observatory while the real Supabase-backed backend is built. The constants
 * and formulas are kept faithful to the engine so the UI shows realistic,
 * coherent numbers. When the live backend lands, the route handlers swap to
 * querying Supabase and this module is no longer on the read path.
 */

export const TRADING_DAYS_PER_YEAR = 252;
export const VOLATILITY_WINDOWS = [7, 30, 60, 90, 180, 252] as const;
export const TREND_WINDOWS = [10, 30, 90] as const;
export const TREND_RISING_THRESHOLD = 1.08;
export const TREND_FALLING_THRESHOLD = 0.92;
export const REGIME_BREAKPOINTS = [0.8, 1.2, 1.8, 2.5] as const;
export const REGIME_LABELS = [
  "CALM",
  "NORMAL",
  "ELEVATED",
  "STRESSED",
  "CRISIS",
] as const;
export const MULTIPLIER_FLOOR = 0.8;
export const MULTIPLIER_CEILING = 3.0;
export const HISTORICAL_VAR_LOOKBACK = 252;
export const HISTORICAL_VAR_CONFIDENCE = 0.995;
export const HISTORICAL_VAR_30D_SCALER = Math.sqrt(30);
export const VAR_COVERAGE_TARGET = 0.99;

export const TERM_STRUCTURE_BUCKET_DAYS: Record<string, number> = {
  "<=7d": 7,
  "<=30d": 30,
  "<=60d": 60,
  "<=90d": 90,
  "<=180d": 180,
  ">180d": TRADING_DAYS_PER_YEAR,
};

export const MULTIPLIER_BUCKET_WEIGHTS: Record<string, Record<number, number>> =
  {
    "<=14d": { 10: 1.0 },
    "<=30d": { 10: 0.6, 30: 0.4 },
    "<=60d": { 10: 0.6, 30: 0.4 },
    "<=90d": { 10: 0.3, 30: 0.3, 90: 0.4 },
    "<=180d": { 10: 0.2, 30: 0.35, 90: 0.45 },
    ">180d": { 10: 0.1, 30: 0.3, 90: 0.6 },
  };

export type RegimeLabel = (typeof REGIME_LABELS)[number];

// --- seeded PRNG ---------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Box-Muller standard normal from a uniform generator. */
function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// --- rolling statistics --------------------------------------------------

function rollingStd(values: number[], window: number, index: number): number {
  if (index + 1 < window) return NaN;
  const slice = values.slice(index - window + 1, index + 1);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance =
    slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (slice.length - 1);
  return Math.sqrt(variance);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function annualizedVol(
  logReturns: number[],
  window: number,
  index: number,
): number {
  return rollingStd(logReturns, Math.max(window, 2), index) * Math.sqrt(
    TRADING_DAYS_PER_YEAR,
  );
}

export function histVar(
  logReturns: number[],
  window: number,
  index: number,
): number {
  if (index + 1 < window) return NaN;
  const slice = logReturns
    .slice(index - window + 1, index + 1)
    .map((r) => Math.abs(r))
    .sort((a, b) => a - b);
  return quantile(slice, HISTORICAL_VAR_CONFIDENCE);
}

export function classifyRegime(acceleration: number): [RegimeLabel, number] {
  for (let i = 0; i < REGIME_BREAKPOINTS.length; i++) {
    if (acceleration < REGIME_BREAKPOINTS[i]) return [REGIME_LABELS[i], i + 1];
  }
  return [REGIME_LABELS[REGIME_LABELS.length - 1], REGIME_LABELS.length];
}

export function classifyTrend(ratio: number): "RISING" | "FLAT" | "FALLING" {
  if (ratio > TREND_RISING_THRESHOLD) return "RISING";
  if (ratio < TREND_FALLING_THRESHOLD) return "FALLING";
  return "FLAT";
}

export function combineTrendSignals(
  signals: Array<"RISING" | "FLAT" | "FALLING">,
): "STRONG_RISING" | "STRONG_FALLING" | "FLAT" | "MIXED_SIGNAL" {
  if (signals.every((s) => s === "RISING")) return "STRONG_RISING";
  if (signals.every((s) => s === "FALLING")) return "STRONG_FALLING";
  if (signals.every((s) => s === "FLAT")) return "FLAT";
  return "MIXED_SIGNAL";
}

export function termStructure(
  vols: Record<number, number>,
): Record<string, number> {
  const front = vols[30];
  const anchor = vols[252];
  const structure: Record<string, number> = {
    "<=7d": vols[7],
    "<=30d": vols[30],
  };
  for (const bucket of ["<=60d", "<=90d", "<=180d"]) {
    const weight = TERM_STRUCTURE_BUCKET_DAYS[bucket] / TRADING_DAYS_PER_YEAR;
    structure[bucket] = Math.sqrt(
      (1 - weight) * front ** 2 + weight * anchor ** 2,
    );
  }
  structure[">180d"] = vols[252];
  return structure;
}

export function tenorMultipliers(
  acceleration: number,
  trends: Record<number, number>,
): Record<string, number> {
  const base = Math.max(MULTIPLIER_FLOOR, Math.min(MULTIPLIER_CEILING, acceleration));
  const multipliers: Record<string, number> = {};
  for (const [bucket, weights] of Object.entries(MULTIPLIER_BUCKET_WEIGHTS)) {
    let weightedTrend = 0;
    for (const [windowStr, weight] of Object.entries(weights)) {
      weightedTrend += trends[Number(windowStr)] * weight;
    }
    const adjustment =
      bucket === "<=14d"
        ? Math.max(0, weightedTrend - 1)
        : 0.5 * (weightedTrend - 1);
    multipliers[bucket] = Math.max(
      MULTIPLIER_FLOOR,
      Math.min(MULTIPLIER_CEILING, base + adjustment),
    );
  }
  return multipliers;
}

/**
 * Build a daily price series via a geometric random walk with a drift and a
 * time-varying volatility, then a `stress` ramp over the final ~45 days so the
 * generated pairs land across the full regime spectrum.
 */
export function buildPriceSeries(
  seed: number,
  startRate: number,
  baseVolAnnual: number,
  drift: number,
  stress: number,
  days: number,
): number[] {
  const rng = mulberry32(seed);
  const dailyVol = baseVolAnnual / Math.sqrt(TRADING_DAYS_PER_YEAR);
  const dailyDrift = drift / TRADING_DAYS_PER_YEAR;
  const prices: number[] = [startRate];
  for (let i = 1; i < days; i++) {
    const fromEnd = days - i;
    // Ramp volatility up over the trailing window to create regime variety.
    // The exponent concentrates the build into the most recent sessions so the
    // 30d window reflects it strongly relative to the 252d baseline.
    const stressFactor =
      fromEnd < 35 ? 1 + (stress - 1) * (1 - fromEnd / 35) ** 0.7 : 1;
    const shock = gaussian(rng) * dailyVol * stressFactor;
    const next = prices[i - 1] * Math.exp(dailyDrift + shock);
    prices.push(next);
  }
  return prices;
}

export function logReturns(prices: number[]): number[] {
  const out: number[] = [NaN];
  for (let i = 1; i < prices.length; i++) {
    out.push(Math.log(prices[i] / prices[i - 1]));
  }
  return out;
}
