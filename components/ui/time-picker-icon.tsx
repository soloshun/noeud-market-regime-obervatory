"use client";

import { Clock8Icon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TimePickerIcon({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-muted-foreground peer-disabled:opacity-50">
        <Clock8Icon className="size-4" />
      </div>
      <Input
        type="time"
        step="60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none pl-9 font-mono text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </div>
  );
}
