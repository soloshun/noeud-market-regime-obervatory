"use client";

import { DataHealthCards, ProviderRunsTable } from "@/components/regime/data-health";
import { EmptyState, SectionTitle } from "@/components/regime/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviderRuns } from "@/hooks/use-regime";

export default function DataHealthPage() {
  const query = useProviderRuns();

  return (
    <>
      <SectionTitle description="Ingestion provenance for the deterministic engine. Every regime snapshot traces back to a provider run.">
        Ingestion &amp; Provider Runs
      </SectionTitle>
      {query.isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[480px] rounded-xl" />
        </>
      ) : query.isError ? (
        <EmptyState title="Provider run data is unavailable" description="Could not reach the data-health API." />
      ) : (
        <>
          <DataHealthCards runs={query.data!} />
          <ProviderRunsTable runs={query.data!} />
        </>
      )}
    </>
  );
}
