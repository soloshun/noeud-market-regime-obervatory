"use client";

import { EmptyState, SectionTitle } from "@/components/regime/primitives";
import { ValidationKpis, ValidationTable } from "@/components/regime/validation-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidations } from "@/hooks/use-regime";

export default function ValidationPage() {
  const query = useValidations();

  return (
    <>
      <SectionTitle description="The intelligence layer validates the deterministic read against grounded market context. It never overrides the engine.">
        Validation Overview
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
      ) : (
        <>
          <ValidationKpis runs={query.data!} />
          <ValidationTable runs={query.data!} />
        </>
      )}
    </>
  );
}
