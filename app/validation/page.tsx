"use client";

import { EmptyState, SectionTitle } from "@/components/regime/primitives";
import { ValidationKpis, ValidationLog } from "@/components/regime/validation-log";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidationRuns } from "@/hooks/use-regime";

export default function ValidationPage() {
  const query = useValidationRuns();

  return (
    <>
      <SectionTitle description="Every LLM validation run, newest first. Each run validates a specific currency pair's deterministic snapshot — open one to see its full trace under that pair.">
        Validation Runs
      </SectionTitle>
      {query.isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-xl" />
        </>
      ) : query.isError ? (
        <EmptyState title="Validation data is unavailable" description="Could not reach the validation API." />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          title="No validation runs yet"
          description="The intelligence layer has not scored any snapshots yet. Runs will appear here as they are recorded."
        />
      ) : (
        <>
          <ValidationKpis runs={query.data!} />
          <ValidationLog runs={query.data!} />
        </>
      )}
    </>
  );
}
