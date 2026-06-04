"use client";

import { create } from "zustand";

import type { RegimeLabel } from "@/lib/types";

export type RegimeFilter = RegimeLabel | "ALL";
export type CurrencyFilter = string | "ALL";

type ObservatoryState = {
  regimeFilter: RegimeFilter;
  baseFilter: CurrencyFilter;
  quoteFilter: CurrencyFilter;
  search: string;
  setRegimeFilter: (value: RegimeFilter) => void;
  setBaseFilter: (value: CurrencyFilter) => void;
  setQuoteFilter: (value: CurrencyFilter) => void;
  setSearch: (value: string) => void;
  reset: () => void;
};

export const useObservatoryStore = create<ObservatoryState>((set) => ({
  regimeFilter: "ALL",
  baseFilter: "ALL",
  quoteFilter: "ALL",
  search: "",
  setRegimeFilter: (regimeFilter) => set({ regimeFilter }),
  setBaseFilter: (baseFilter) => set({ baseFilter }),
  setQuoteFilter: (quoteFilter) => set({ quoteFilter }),
  setSearch: (search) => set({ search }),
  reset: () => set({ regimeFilter: "ALL", baseFilter: "ALL", quoteFilter: "ALL", search: "" }),
}));
