"use client";

import { EmptyState, SectionTitle } from "@/components/regime/primitives";
import { PerformanceLab } from "@/components/regime/performance-lab";
import { Skeleton } from "@/components/ui/skeleton";
import { useBenchmarkResults } from "@/hooks/use-regime";

export default function PerformancePage() {
  const query = useBenchmarkResults();

  return (
    <>
      <SectionTitle description="Matured outcome scoring for quant-only multipliers versus LLM-adjusted recommendations. Rows only appear after the future tenor window has enough observed market data.">
        Performance Lab
      </SectionTitle>
      {query.isLoading ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[116px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[460px] rounded-xl" />
        </>
      ) : query.isError ? (
        <EmptyState title="Benchmark data is unavailable" description="Could not reach the benchmark API." />
      ) : (
        <PerformanceLab results={query.data ?? []} />
      )}
    </>
  );
}
