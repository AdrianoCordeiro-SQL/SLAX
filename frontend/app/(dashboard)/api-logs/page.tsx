"use client";

import { useState } from "react";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { LogsTable } from "@/components/reports/LogsTable";
import { getDefaultReportDateRange } from "@/lib/date-range";

export default function ApiLogsPage() {
  const [{ start, end }, setRange] = useState(getDefaultReportDateRange);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Eventos da plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Navegue e filtre eventos da sua operação de e-commerce.
          </p>
        </div>
        <DateRangeFilter
          start={start}
          end={end}
          onChange={(s, e) => setRange({ start: s, end: e })}
        />
      </div>

      <LogsTable start={start} end={end} />
    </div>
  );
}
