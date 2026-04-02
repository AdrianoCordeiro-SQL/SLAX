"use client";

import { useState } from "react";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { LogsTable } from "@/components/reports/LogsTable";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DEFAULT_END = toISODate(new Date());
const DEFAULT_START = toISODate(new Date(Date.now() - 30 * 86_400_000));

export default function ApiLogsPage() {
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(DEFAULT_END);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">API Logs</h1>
          <p className="text-sm text-muted-foreground">
            Browse and filter all API activity logs.
          </p>
        </div>
        <DateRangeFilter
          start={start}
          end={end}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
        />
      </div>

      <LogsTable start={start} end={end} />
    </div>
  );
}
