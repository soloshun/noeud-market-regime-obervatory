"use client";

import { EmptyState, SectionTitle } from "@/components/regime/primitives";
import { PerformanceLab } from "@/components/regime/performance-lab";
import { Skeleton } from "@/components/ui/skeleton";
import { useBenchmarkResults, useValidationRuns } from "@/hooks/use-regime";

export default function PerformancePage() {
  const query = useBenchmarkResults();
  const validationsQuery = useValidationRuns();
  const isLoading = query.isLoading || validationsQuery.isLoading;
  const isError = query.isError || validationsQuery.isError;

  return (
    <>
      <SectionTitle description="Matured outcome scoring for quant-only multipliers versus LLM-adjusted recommendations. The scheduled evaluator publishes rows as tenor windows mature.">
        Performance Lab
      </SectionTitle>
      {isLoading ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[116px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[460px] rounded-xl" />
        </>
      ) : isError ? (
        <EmptyState title="Benchmark data is unavailable" description="Could not reach the benchmark API." />
      ) : (
        <PerformanceLab
          results={query.data ?? []}
          validations={validationsQuery.data ?? []}
        />
      )}
    </>
  );
}
