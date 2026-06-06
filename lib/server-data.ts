import {
  getAllValidations as getMockAllValidations,
  getAsOf as getMockAsOf,
  getBenchmarkResults as getMockBenchmarkResults,
  getHistory as getMockHistory,
  getLatestSnapshots as getMockLatestSnapshots,
  getPrices as getMockPrices,
  getProviderRuns as getMockProviderRuns,
  getSnapshot as getMockSnapshot,
  getSupportedPairs as getMockSupportedPairs,
  getValidation as getMockValidation,
} from "@/lib/mock/dataset";
import type {
  CompositeSignal,
  BenchmarkResult,
  LLMCallRecord,
  ProviderRun,
  RawPriceObservation,
  RecommendedAction,
  RegimeHistoryPoint,
  RegimeLabel,
  RegimeSnapshot,
  ResearchBrief,
  MarketSentiment,
  TrendAdjustmentDirection,
  TrendAwareMultiplierMap,
  ValidationResult,
  ValidationRun,
  ValidationRunSource,
  ValidationStatus,
} from "@/lib/types";

type JsonRecord = Record<string, unknown>;

type SnapshotRow = {
  id: string;
  provider_run_id: string | null;
  pair_code: string;
  as_of_date: string;
  spot_rate: number;
  prior_close: number;
  day_change: number;
  day_change_pct: number;
  regime: string;
  regime_score: number;
  acceleration_vs_252d: number;
  vol_7d: number;
  vol_30d: number;
  vol_60d: number;
  vol_90d: number;
  vol_180d: number;
  vol_252d: number;
  trend_10d: number;
  trend_30d: number;
  trend_90d: number;
  composite_signal: string;
  hist_var_99_30d: number;
  fat_tail_ratio: number;
  snapshot_payload: RegimeSnapshot;
  created_at: string;
};

type ValidationRow = {
  id: string;
  market_regime_snapshot_id: string | null;
  pair_code: string;
  as_of_date: string;
  status: string;
  model_name: string;
  prompt_version: string | null;
  run_source: string | null;
  output_payload: JsonRecord | null;
  rationale: string | null;
  confidence: number | null;
  market_sentiment: string | null;
  trend_adjustment_direction: string | null;
  trend_adjustment_pct: number | null;
  trend_adjustment_confidence: number | null;
  deterministic_primary_trend_multiplier: number | null;
  recommended_primary_trend_multiplier: number | null;
  primary_trend_aware_tenor: string | null;
  deterministic_trend_aware_multipliers: JsonRecord | null;
  llm_recommended_trend_aware_multipliers: JsonRecord | null;
  created_at: string;
};

type BenchmarkRow = BenchmarkResult;

type SupabaseConfig = {
  url: string;
  key: string;
};

const FALLBACK_WARNING =
  "Using fixture data because Supabase is not configured or did not respond.";

function dataSourceMode() {
  return (process.env.OBSERVATORY_DATA_SOURCE ?? "auto").trim().toLowerCase();
}

function supabaseConfig(): SupabaseConfig | null {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_KEY?.trim() ||
    "";
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function shouldUseSupabase() {
  const mode = dataSourceMode();
  return mode === "supabase" || (mode === "auto" && supabaseConfig() !== null);
}

async function supabaseGet<T>(
  table: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T[]> {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");

  const url = new URL(`${config.url}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${table} request failed: ${response.status} ${body}`);
  }

  return (await response.json()) as T[];
}

async function withFallback<T>(loadSupabase: () => Promise<T>, loadMock: () => T): Promise<T> {
  if (!shouldUseSupabase()) return loadMock();
  try {
    return await loadSupabase();
  } catch (error) {
    if (dataSourceMode() === "supabase") throw error;
    console.warn(FALLBACK_WARNING, error);
    return loadMock();
  }
}

function displayPair(pair: string) {
  return `${pair.slice(0, 3)}/${pair.slice(3)}`;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value ? value : fallback;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function isRegime(value: unknown): value is RegimeLabel {
  return ["CALM", "NORMAL", "ELEVATED", "STRESSED", "CRISIS"].includes(String(value));
}

function isComposite(value: unknown): value is CompositeSignal {
  return ["STRONG_RISING", "STRONG_FALLING", "FLAT", "MIXED_SIGNAL"].includes(
    String(value),
  );
}

function isValidationStatus(value: unknown): value is ValidationStatus {
  return [
    "supports",
    "partially_supports",
    "contradicts",
    "insufficient_evidence",
  ].includes(String(value));
}

function validationRunSource(value: unknown): ValidationRunSource {
  if (["scheduled", "manual", "backfill", "test"].includes(String(value))) {
    return value as ValidationRunSource;
  }
  return "unknown";
}

function isRecommendedAction(value: unknown): value is RecommendedAction {
  return [
    "accept_deterministic_read",
    "monitor_closely",
    "escalate_for_human_review",
    "rerun_with_deeper_research",
  ].includes(String(value));
}

function isMarketSentiment(value: unknown): value is MarketSentiment {
  return [
    "volatility_dampening",
    "volatility_amplifying",
    "mixed",
    "unclear",
  ].includes(String(value));
}

function isTrendAdjustmentDirection(value: unknown): value is TrendAdjustmentDirection {
  return ["increase", "decrease", "hold", "insufficient_evidence"].includes(String(value));
}

function isTrendAwareTenor(value: unknown): value is keyof TrendAwareMultiplierMap {
  return [
    "tenor_le_14d",
    "tenor_le_30d",
    "tenor_le_60d",
    "tenor_le_90d",
    "tenor_le_180d",
    "tenor_gt_180d",
  ].includes(String(value));
}

function trendAwareMapFromRecord(value: unknown, fallback = 0): TrendAwareMultiplierMap {
  const record = asRecord(value);
  return {
    tenor_le_14d: asNumber(record.tenor_le_14d, fallback),
    tenor_le_30d: asNumber(record.tenor_le_30d, fallback),
    tenor_le_60d: asNumber(record.tenor_le_60d, fallback),
    tenor_le_90d: asNumber(record.tenor_le_90d, fallback),
    tenor_le_180d: asNumber(record.tenor_le_180d, fallback),
    tenor_gt_180d: asNumber(record.tenor_gt_180d, fallback),
  };
}

function snapshotFromRow(row: SnapshotRow): RegimeSnapshot {
  return row.snapshot_payload;
}

function historyFromRow(row: SnapshotRow): RegimeHistoryPoint {
  return {
    as_of_date: row.as_of_date,
    spot_rate: row.spot_rate,
    day_change_pct: row.day_change_pct,
    regime: isRegime(row.regime) ? row.regime : "NORMAL",
    regime_score: row.regime_score,
    acceleration_vs_252d: row.acceleration_vs_252d,
    vol_7d: row.vol_7d,
    vol_30d: row.vol_30d,
    vol_90d: row.vol_90d,
    vol_252d: row.vol_252d,
    trend_30d: row.trend_30d,
    composite_signal: isComposite(row.composite_signal)
      ? row.composite_signal
      : "MIXED_SIGNAL",
    hist_var_99_30d: row.hist_var_99_30d,
    fat_tail_ratio: row.fat_tail_ratio,
  };
}

function fallbackResearchBrief(pair: string, asOf: string): ResearchBrief {
  return {
    pair,
    display_pair: displayPair(pair),
    as_of_date: asOf,
    macro_context: "No research brief was stored for this validation run.",
    central_bank_context: "No central-bank context was stored for this validation run.",
    currency_specific_context: "No currency-specific context was stored.",
    market_sentiment_summary: "No market sentiment summary was stored.",
    policy_liquidity_context: "No policy/liquidity context was stored.",
    risk_events: [],
    evidence: [],
    retrieval_model: "unknown",
  };
}

function callRecordFromPayload(value: unknown): LLMCallRecord {
  const record = asRecord(value);
  const role = asString(record.call_role, "scorer");
  return {
    call_role:
      role === "research" || role === "aggregation" || role === "scorer"
        ? role
        : "scorer",
    model: asString(record.model, "unknown"),
    raw_content: asString(record.raw_content),
    parsed_json: asRecord(record.parsed_json),
    citations: asArray<JsonRecord>(record.citations).map((citation) => ({
      url: asString(citation.url),
      title: asString(citation.title),
      content: asString(citation.content),
    })),
    reasoning_content:
      typeof record.reasoning_content === "string" ? record.reasoning_content : null,
  };
}

function validationResultFromPayload(
  value: unknown,
  row: ValidationRow,
  brief: ResearchBrief,
): ValidationResult {
  const record = asRecord(value);
  const pair = asString(record.pair, row.pair_code);
  const status = isValidationStatus(record.status) ? record.status : "insufficient_evidence";
  const regime = isRegime(record.deterministic_regime)
    ? record.deterministic_regime
    : "NORMAL";
  const action = isRecommendedAction(record.recommended_action)
    ? record.recommended_action
    : "rerun_with_deeper_research";
  const deterministicMultipliers = trendAwareMapFromRecord(
    record.deterministic_trend_aware_multipliers ??
      row.deterministic_trend_aware_multipliers,
    asNumber(row.deterministic_primary_trend_multiplier, 0),
  );
  const recommendedMultipliers = trendAwareMapFromRecord(
    record.llm_recommended_trend_aware_multipliers ??
      row.llm_recommended_trend_aware_multipliers,
    asNumber(row.recommended_primary_trend_multiplier, 0),
  );
  const primaryTenor = isTrendAwareTenor(
    record.primary_trend_aware_tenor ?? row.primary_trend_aware_tenor,
  )
    ? (record.primary_trend_aware_tenor ?? row.primary_trend_aware_tenor)
    : "tenor_le_30d";
  const marketSentimentValue = record.market_sentiment ?? row.market_sentiment;
  const marketSentiment: MarketSentiment = isMarketSentiment(marketSentimentValue)
    ? marketSentimentValue
    : "unclear";
  const trendDirectionValue = record.trend_adjustment_direction ?? row.trend_adjustment_direction;
  const trendAdjustmentDirection: TrendAdjustmentDirection = isTrendAdjustmentDirection(
    trendDirectionValue,
  )
    ? trendDirectionValue
    : "insufficient_evidence";

  return {
    pair,
    display_pair: asString(record.display_pair, displayPair(pair)),
    as_of_date: asString(record.as_of_date, row.as_of_date),
    status,
    confidence: asNumber(record.confidence, row.confidence ?? 0),
    deterministic_regime: regime,
    external_context_regime_read: asString(record.external_context_regime_read, regime),
    validation_summary: asString(
      record.validation_summary,
      "Validation output did not include a summary.",
    ),
    rationale: asString(record.rationale, row.rationale ?? ""),
    market_sentiment: marketSentiment,
    trend_aware_validation_summary: asString(
      record.trend_aware_validation_summary,
      asString(record.validation_summary, "No trend-aware summary stored."),
    ),
    deterministic_trend_aware_multipliers: deterministicMultipliers,
    llm_recommended_trend_aware_multipliers: recommendedMultipliers,
    primary_trend_aware_tenor: primaryTenor as keyof TrendAwareMultiplierMap,
    deterministic_primary_trend_multiplier: asNumber(
      record.deterministic_primary_trend_multiplier,
      asNumber(row.deterministic_primary_trend_multiplier, deterministicMultipliers.tenor_le_30d),
    ),
    recommended_primary_trend_multiplier: asNumber(
      record.recommended_primary_trend_multiplier,
      asNumber(row.recommended_primary_trend_multiplier, recommendedMultipliers.tenor_le_30d),
    ),
    trend_adjustment_direction: trendAdjustmentDirection,
    trend_adjustment_pct: asNumber(
      record.trend_adjustment_pct,
      asNumber(row.trend_adjustment_pct, 0),
    ),
    trend_adjustment_confidence: asNumber(
      record.trend_adjustment_confidence,
      asNumber(row.trend_adjustment_confidence, 0),
    ),
    trend_adjustment_rationale: asString(
      record.trend_adjustment_rationale,
      asString(record.rationale, row.rationale ?? ""),
    ),
    trend_driver_evidence: asArray<string>(record.trend_driver_evidence),
    supporting_points: asArray<string>(record.supporting_points),
    contradicting_points: asArray<string>(record.contradicting_points),
    watch_items: asArray<string>(record.watch_items),
    recommended_action: action,
    scorer_model: asString(record.scorer_model, row.model_name),
    prompt_version: asString(record.prompt_version, row.prompt_version ?? "unknown"),
    research_brief: brief,
  };
}

function validationFromRow(row: ValidationRow): ValidationRun {
  const output = asRecord(row.output_payload);
  const briefPayload = output.research_brief ?? asRecord(output.validation_result).research_brief;
  const brief = {
    ...fallbackResearchBrief(row.pair_code, row.as_of_date),
    ...asRecord(briefPayload),
  } as ResearchBrief;
  const result = validationResultFromPayload(output.validation_result, row, brief);
  const independent = asArray(output.independent_scorer_results).map((item) =>
    validationResultFromPayload(item, row, brief),
  );

  return {
    id: row.id,
    pair_code: row.pair_code,
    as_of_date: row.as_of_date,
    status: isValidationStatus(row.status) ? row.status : result.status,
    model_name: row.model_name,
    prompt_version: row.prompt_version,
    run_source: validationRunSource(row.run_source),
    confidence: row.confidence,
    rationale: row.rationale,
    market_sentiment: isMarketSentiment(row.market_sentiment) ? row.market_sentiment : null,
    trend_adjustment_direction: isTrendAdjustmentDirection(row.trend_adjustment_direction)
      ? row.trend_adjustment_direction
      : null,
    trend_adjustment_pct: row.trend_adjustment_pct,
    trend_adjustment_confidence: row.trend_adjustment_confidence,
    deterministic_primary_trend_multiplier: row.deterministic_primary_trend_multiplier,
    recommended_primary_trend_multiplier: row.recommended_primary_trend_multiplier,
    primary_trend_aware_tenor: isTrendAwareTenor(row.primary_trend_aware_tenor)
      ? row.primary_trend_aware_tenor
      : null,
    deterministic_trend_aware_multipliers: row.deterministic_trend_aware_multipliers
      ? trendAwareMapFromRecord(row.deterministic_trend_aware_multipliers)
      : null,
    llm_recommended_trend_aware_multipliers: row.llm_recommended_trend_aware_multipliers
      ? trendAwareMapFromRecord(row.llm_recommended_trend_aware_multipliers)
      : null,
    created_at: row.created_at,
    result,
    independent_scorer_results: independent,
    raw_model_responses: asArray(output.raw_model_responses).map(callRecordFromPayload),
  };
}

async function latestSnapshotRows(): Promise<SnapshotRow[]> {
  return supabaseGet<SnapshotRow>("latest_market_regime_snapshots", {
    select: "*",
    order: "pair_code.asc",
  });
}

export async function getAsOf(): Promise<string | null> {
  return withFallback(
    async () => {
      const rows = await latestSnapshotRows();
      return rows.reduce<string | null>(
        (latest, row) => (!latest || row.as_of_date > latest ? row.as_of_date : latest),
        null,
      );
    },
    () => getMockAsOf(),
  );
}

export async function getSupportedPairs(): Promise<string[]> {
  return withFallback(
    async () => (await latestSnapshotRows()).map((row) => row.pair_code),
    () => getMockSupportedPairs(),
  );
}

export async function getLatestSnapshots(): Promise<RegimeSnapshot[]> {
  return withFallback(
    async () => (await latestSnapshotRows()).map(snapshotFromRow),
    () => getMockLatestSnapshots(),
  );
}

export async function getSnapshot(pair: string): Promise<RegimeSnapshot | null> {
  const code = pair.toUpperCase();
  return withFallback(
    async () => {
      const rows = await supabaseGet<SnapshotRow>("latest_market_regime_snapshots", {
        select: "*",
        pair_code: `eq.${code}`,
        limit: 1,
      });
      return rows[0] ? snapshotFromRow(rows[0]) : null;
    },
    () => getMockSnapshot(code),
  );
}

export async function getHistory(pair: string): Promise<RegimeHistoryPoint[]> {
  const code = pair.toUpperCase();
  return withFallback(
    async () => {
      const rows = await supabaseGet<SnapshotRow>("market_regime_snapshots", {
        select: "*",
        pair_code: `eq.${code}`,
        order: "as_of_date.desc",
        limit: 180,
      });
      return rows.map(historyFromRow).reverse();
    },
    () => getMockHistory(code),
  );
}

export async function getPrices(pair: string): Promise<RawPriceObservation[]> {
  const code = pair.toUpperCase();
  return withFallback(
    async () => {
      const rows = await supabaseGet<RawPriceObservation>("raw_price_observations", {
        select: "observed_on,close_raw,close_display",
        pair_code: `eq.${code}`,
        order: "observed_on.desc",
        limit: 180,
      });
      return rows.reverse();
    },
    () => getMockPrices(code),
  );
}

export async function getProviderRuns(pair?: string): Promise<ProviderRun[]> {
  const code = pair?.toUpperCase();
  return withFallback(
    async () =>
      supabaseGet<ProviderRun>("provider_runs", {
        select: "*",
        pair_code: code ? `eq.${code}` : undefined,
        order: "created_at.desc",
        limit: 300,
      }),
    () => getMockProviderRuns(code),
  );
}

export async function getAllValidations(): Promise<ValidationRun[]> {
  return withFallback(
    async () => {
      const rows = await supabaseGet<ValidationRow>("latest_llm_validation_runs", {
        select: "*",
        order: "pair_code.asc",
      });
      return rows.map(validationFromRow);
    },
    () => getMockAllValidations(),
  );
}

export async function getValidation(pair: string): Promise<ValidationRun | null> {
  const code = pair.toUpperCase();
  return withFallback(
    async () => {
      const rows = await supabaseGet<ValidationRow>("latest_llm_validation_runs", {
        select: "*",
        pair_code: `eq.${code}`,
        limit: 1,
      });
      return rows[0] ? validationFromRow(rows[0]) : null;
    },
    () => getMockValidation(code),
  );
}

/** Every validation run for one pair (a pair can be validated many times). */
export async function getValidationsForPair(pair: string): Promise<ValidationRun[]> {
  const code = pair.toUpperCase();
  return withFallback(
    async () => {
      const rows = await supabaseGet<ValidationRow>("llm_validation_runs", {
        select: "*",
        pair_code: `eq.${code}`,
        order: "created_at.desc",
        limit: 100,
      });
      return rows.map(validationFromRow);
    },
    () => {
      const run = getMockValidation(code);
      return run ? [run] : [];
    },
  );
}

/** Every validation run across all pairs, newest first (the validation log). */
export async function getValidationRuns(): Promise<ValidationRun[]> {
  return withFallback(
    async () => {
      const rows = await supabaseGet<ValidationRow>("llm_validation_runs", {
        select: "*",
        order: "created_at.desc",
        limit: 300,
      });
      return rows.map(validationFromRow);
    },
    () => getMockAllValidations(),
  );
}

export async function getBenchmarkResults(): Promise<BenchmarkResult[]> {
  return withFallback(
    async () => {
      const rows = await supabaseGet<BenchmarkRow>("benchmark_results", {
        select: "*",
        order: "maturity_date.desc",
        limit: 1000,
      });
      return rows.map((row) => ({
        ...row,
        tenor_key: isTrendAwareTenor(row.tenor_key) ? row.tenor_key : "tenor_le_30d",
        llm_direction: isTrendAdjustmentDirection(row.llm_direction)
          ? row.llm_direction
          : "insufficient_evidence",
      }));
    },
    () => getMockBenchmarkResults(),
  );
}
