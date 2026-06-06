import { cn } from "@/lib/utils";

export function toLocalCurrencyMove(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return -value;
}

export function localCurrencyMoveClass(value: number | null | undefined) {
  return cn(
    value != null && value < 0 && "text-red-600 dark:text-red-400",
    value != null && value > 0 && "text-emerald-600 dark:text-emerald-400",
  );
}

export const LOCAL_CURRENCY_MOVE_TITLE =
  "Ghanaian risk lens: raw USD/GHS up means GHS weakness, so the displayed local move is inverted.";
