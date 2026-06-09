"use client";

import * as React from "react";
import * as chrono from "chrono-node";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatDate(value?: Date) {
  return value ? format(value, "PP") : "Pick date";
}

function parseNaturalDate(value: string, referenceDate: Date) {
  const parsed = chrono.parseDate(value, referenceDate, { forwardDate: false });
  return parsed ?? undefined;
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function DatePickerNaturalLanguage({
  value,
  onChange,
  min,
  max,
  placeholder = "Try “last Friday”",
  className,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  min?: Date;
  max?: Date;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");

  const commitText = () => {
    if (!text.trim()) return;
    const parsed = parseNaturalDate(text, value ?? new Date());
    if (!parsed) return;
    const parsedDay = startOfLocalDay(parsed);
    if (min && parsedDay < startOfLocalDay(min)) return;
    if (max && parsedDay > startOfLocalDay(max)) return;
    onChange(parsed);
    setText("");
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 min-w-40 justify-start gap-2 font-mono text-xs",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="size-3.5" />
              {formatDate(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value}
              disabled={[
                ...(min ? [{ before: min }] : []),
                ...(max ? [{ after: max }] : []),
              ]}
              onSelect={(date) => {
                onChange(date);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitText();
            }
          }}
          placeholder={placeholder}
          className="h-10 min-w-0 font-mono text-xs"
        />
      </div>
    </div>
  );
}
