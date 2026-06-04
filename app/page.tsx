"use client";

import { ObservatoryShell } from "@/components/observatory-shell";
import { EmptyState } from "@/components/regime/primitives";
import { OverviewCards } from "@/components/regime/overview-cards";
import {
  AccelerationLeaderboard,
  RegimeDistributionChart,
} from "@/components/regime/overview-charts";
import { PairsTable } from "@/components/regime/pairs-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegimeOverview } from "@/hooks/use-regime";

export default function OverviewPage() {
  const query = useRegimeOverview();

  return (
    <ObservatoryShell title="Overview">
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title="Regime data is unavailable"
          description="Could not reach the regime API. The deterministic snapshots will appear here once the service responds."
        />
      ) : (
        <>
          <OverviewCards
            snapshots={query.data!.snapshots}
            asOf={query.data!.as_of_date}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RegimeDistributionChart snapshots={query.data!.snapshots} />
            <AccelerationLeaderboard snapshots={query.data!.snapshots} />
          </div>
          <PairsTable snapshots={query.data!.snapshots} />
        </>
      )}
    </ObservatoryShell>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[136px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[330px] rounded-xl" />
        <Skeleton className="h-[330px] rounded-xl" />
      </div>
      <Skeleton className="h-[480px] rounded-xl" />
    </>
  );
}
