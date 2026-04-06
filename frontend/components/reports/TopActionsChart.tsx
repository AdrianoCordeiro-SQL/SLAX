"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AsyncChartCard } from "@/components/charts/AsyncChartCard";
import { ChartLineSkeleton } from "@/components/charts/ChartLineSkeleton";
import { useTopActions } from "@/hooks/useReports";

interface TopActionsChartProps {
  start: string;
  end: string;
}

export function TopActionsChart({ start, end }: TopActionsChartProps) {
  const { data, isLoading, error } = useTopActions(start, end);
  const empty = !data?.length;

  return (
    <AsyncChartCard
      title="Top payment events"
      isLoading={isLoading}
      error={error}
      empty={empty}
      errorPrefix="Failed to load top payment events"
      skeleton={<ChartLineSkeleton />}
    >
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              type="category"
              dataKey="action"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
              formatter={(value) => {
                const num =
                  typeof value === "number"
                    ? value
                    : typeof value === "string"
                      ? Number(value)
                      : Number(value ?? 0);
                return [num, "Events"];
              }}
            />
            <Bar dataKey="count" fill="#1e2d5a" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </AsyncChartCard>
  );
}
