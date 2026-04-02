"use client";

import { useState } from "react";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { LogsTable } from "@/components/reports/LogsTable";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { RevenueTrendChart } from "@/components/reports/RevenueTrendChart";
import { StatusBreakdownChart } from "@/components/reports/StatusBreakdownChart";
import { TopActionsChart } from "@/components/reports/TopActionsChart";
import { TopUsersRanking } from "@/components/reports/TopUsersRanking";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DEFAULT_END = toISODate(new Date());
const DEFAULT_START = toISODate(
  new Date(Date.now() - 30 * 86_400_000),
);

export default function ReportsPage() {
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(DEFAULT_END);

  function handleRangeChange(s: string, e: string) {
    setStart(s);
    setEnd(e);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Analyze metrics and activity for any time period.
          </p>
        </div>
        <DateRangeFilter start={start} end={end} onChange={handleRangeChange} />
      </div>

      <ReportSummaryCards start={start} end={end} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusBreakdownChart start={start} end={end} />
        <TopActionsChart start={start} end={end} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueTrendChart start={start} end={end} />
        <TopUsersRanking start={start} end={end} />
      </div>

      <LogsTable start={start} end={end} />
    </div>
  );
}
