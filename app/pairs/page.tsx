"use client";

import { ObservatoryShell } from "@/components/observatory-shell";
import { PairGrid } from "@/components/regime/pair-grid";
import { EmptyState, SectionTitle } from "@/components/regime/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegimeOverview } from "@/hooks/use-regime";

export default function PairsIndexPage() {
  const query = useRegimeOverview();

  return (
    <ObservatoryShell title="Pair Review">
      <SectionTitle description="Select a pair to inspect its full deterministic snapshot and LLM validation.">
        All Pairs
      </SectionTitle>
      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState title="Regime data is unavailable" description="Could not reach the regime API." />
      ) : (
        <PairGrid snapshots={query.data!.snapshots} />
      )}
    </ObservatoryShell>
  );
}
