"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePairsList } from "@/hooks/use-regime";

export function PairSwitcher({
  current,
  basePath = "/pairs",
  preserveQuery = false,
}: {
  current: string;
  basePath?: string;
  preserveQuery?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const { data } = usePairsList();
  const pairs = data?.pairs ?? [];

  const go = (p: string) => {
    setOpen(false);
    const qs = preserveQuery ? searchParams.toString() : "";
    router.push(`${basePath}/${p}${qs ? `?${qs}` : ""}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-36 justify-between font-mono">
          {current.slice(0, 3)}/{current.slice(3)}
          <ChevronsUpDownIcon className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="end">
        <Command>
          <CommandInput placeholder="Find pair..." className="h-9" />
          <CommandList>
            <CommandEmpty>No pair found.</CommandEmpty>
            <CommandGroup>
              {pairs.map((p) => (
                <CommandItem
                  key={p}
                  value={p}
                  onSelect={() => go(p)}
                  className="font-mono"
                >
                  {p.slice(0, 3)}/{p.slice(3)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
