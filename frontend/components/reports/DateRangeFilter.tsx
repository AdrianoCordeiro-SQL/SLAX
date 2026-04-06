"use client";

import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface DateRangeFilterProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangeFilter({ start, end, onChange }: DateRangeFilterProps) {
  const activeDays = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
  );

  function applyPreset(days: number) {
    const now = new Date();
    onChange(toISODate(new Date(now.getTime() - days * 86_400_000)), toISODate(now));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(({ label, days }) => (
        <button
          key={label}
          onClick={() => applyPreset(days)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeDays === days
              ? "bg-[#1e2d5a] text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
          )}
        >
          {label}
        </button>
      ))}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="date"
          value={start}
          onChange={(e) => onChange(e.target.value, end)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
        <span>até</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onChange(start, e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
