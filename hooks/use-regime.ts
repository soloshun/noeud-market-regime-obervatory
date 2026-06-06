"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  ProviderRun,
  RawPriceObservation,
  RegimeHistoryPoint,
  RegimeOverviewResponse,
  RegimeSnapshot,
  BenchmarkResult,
  ValidationRun,
} from "@/lib/types";

export function useRegimeOverview() {
  return useQuery({
    queryKey: ["regime-overview"],
    queryFn: async () => {
      const { data } = await api.get<RegimeOverviewResponse>("/regimes/latest");
      return data;
    },
  });
}

export function usePairsList() {
  return useQuery({
    queryKey: ["pairs"],
    queryFn: async () => {
      const { data } = await api.get<{ as_of_date: string; pairs: string[] }>("/pairs");
      return data;
    },
  });
}

export function useRegimeSnapshot(pair: string) {
  return useQuery({
    queryKey: ["regime-snapshot", pair],
    queryFn: async () => {
      const { data } = await api.get<RegimeSnapshot>(`/regimes/${pair}`);
      return data;
    },
    enabled: Boolean(pair),
  });
}

export function useRegimeHistory(pair: string) {
  return useQuery({
    queryKey: ["regime-history", pair],
    queryFn: async () => {
      const { data } = await api.get<{ pair: string; points: RegimeHistoryPoint[] }>(
        `/regimes/${pair}/history`,
      );
      return data.points;
    },
    enabled: Boolean(pair),
  });
}

export function usePriceObservations(pair: string) {
  return useQuery({
    queryKey: ["price-observations", pair],
    queryFn: async () => {
      const { data } = await api.get<{
        pair: string;
        observations: RawPriceObservation[];
      }>(`/regimes/${pair}/prices`);
      return data.observations;
    },
    enabled: Boolean(pair),
  });
}

/** Latest validation per pair (used by the overview audit panel). */
export function useValidations() {
  return useQuery({
    queryKey: ["validations"],
    queryFn: async () => {
      const { data } = await api.get<{ as_of_date: string; runs: ValidationRun[] }>(
        "/validations",
      );
      return data.runs;
    },
  });
}

/** Every validation run across all pairs (the validation log page). */
export function useValidationRuns() {
  return useQuery({
    queryKey: ["validation-runs"],
    queryFn: async () => {
      const { data } = await api.get<{ as_of_date: string; runs: ValidationRun[] }>(
        "/validations",
        { params: { scope: "all" } },
      );
      return data.runs;
    },
  });
}

/** All validation runs for a single pair, newest first. */
export function usePairValidations(pair: string) {
  return useQuery({
    queryKey: ["pair-validations", pair],
    queryFn: async () => {
      const { data } = await api.get<{ pair: string; runs: ValidationRun[] }>(
        `/validations/${pair}`,
      );
      return data.runs;
    },
    enabled: Boolean(pair),
  });
}

export function useProviderRuns(pair?: string) {
  return useQuery({
    queryKey: ["provider-runs", pair ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<{ runs: ProviderRun[] }>("/provider-runs", {
        params: pair ? { pair } : undefined,
      });
      return data.runs;
    },
  });
}

export function useBenchmarkResults() {
  return useQuery({
    queryKey: ["benchmark-results"],
    queryFn: async () => {
      const { data } = await api.get<{ as_of_date: string | null; results: BenchmarkResult[] }>(
        "/benchmarks",
      );
      return data.results;
    },
  });
}
