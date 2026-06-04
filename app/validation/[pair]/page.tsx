"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ObservatoryShell } from "@/components/observatory-shell";
import { PairSwitcher } from "@/components/regime/pair-switcher";
import { EmptyState } from "@/components/regime/primitives";
import { ValidationDetail } from "@/components/regime/validation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidation } from "@/hooks/use-regime";

function ValidationDetailView({ code }: { code: string }) {
  const query = useValidation(code);

  return (
    <ObservatoryShell
      title="LLM Validation"
      headerActions={<PairSwitcher current={code} basePath="/validation" />}
    >
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href="/validation">
          <ArrowLeftIcon className="size-3.5" /> All validations
        </Link>
      </Button>
      <div className="font-mono text-lg font-semibold">
        {code.slice(0, 3)}/{code.slice(3)}
      </div>

      {query.isLoading ? (
        <Skeleton className="h-[420px] rounded-xl" />
      ) : query.isError || !query.data ? (
        <EmptyState title={`No validation for ${code}`} description="No LLM validation run was found for this pair." />
      ) : (
        <ValidationDetail run={query.data} />
      )}
    </ObservatoryShell>
  );
}

export default function ValidationDetailPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = React.use(params);
  return (
    <React.Suspense fallback={null}>
      <ValidationDetailView code={pair.toUpperCase()} />
    </React.Suspense>
  );
}
