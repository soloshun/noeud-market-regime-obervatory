"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  ProviderRun,
  RegimeHistoryPoint,
  RegimeOverviewResponse,
  RegimeSnapshot,
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

export function useValidation(pair: string) {
  return useQuery({
    queryKey: ["validation", pair],
    queryFn: async () => {
      const { data } = await api.get<ValidationRun>(`/validations/${pair}`);
      return data;
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
