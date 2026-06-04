"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { EmptyState } from "@/components/regime/primitives";
import { ValidationDetail } from "@/components/regime/validation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidation } from "@/hooks/use-regime";

export default function ValidationDetailPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = React.use(params);
  const code = pair.toUpperCase();
  const query = useValidation(code);

  return (
    <>
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
    </>
  );
}
