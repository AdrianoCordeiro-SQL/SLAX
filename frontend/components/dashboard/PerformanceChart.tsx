"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AsyncChartCard } from "@/components/charts/AsyncChartCard";
import { ChartLineSkeleton } from "@/components/charts/ChartLineSkeleton";
import { usePerformance } from "@/hooks/usePerformance";

export function PerformanceChart() {
  const { data, isLoading, error } = usePerformance();
  const empty = !data?.length;

  return (
    <AsyncChartCard
      title="Performance Over Time (Last 30 Days)"
      isLoading={isLoading}
      error={error}
      empty={empty}
      errorPrefix="Failed to load performance data"
      emptyMessage="No API requests recorded in the last 30 days. Navigate the app (Dashboard, Users, Reports) to record real activity, or run python -m app.seed in the backend for sample data."
      skeleton={<ChartLineSkeleton />}
    >
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(v: number) => `Day ${v}`}
              interval={4}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              width={48}
              label={{
                value: "Requests",
                angle: -90,
                position: "insideLeft",
                offset: 12,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              width={52}
              label={{
                value: "Latency (ms)",
                angle: 90,
                position: "insideRight",
                offset: 16,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const n = String(name ?? "");
                const num =
                  typeof value === "number"
                    ? value
                    : typeof value === "string"
                      ? Number(value)
                      : Array.isArray(value)
                        ? Number(value[0] ?? 0)
                        : Number(value ?? 0);
                return n === "latency"
                  ? [`${num} ms`, "Latency"]
                  : [num, "Requests"];
              }}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="plainline"
              formatter={(value: string) =>
                value === "requests" ? "Requests" : "Latency (ms)"
              }
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="requests"
              stroke="#1e2d5a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="latency"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </AsyncChartCard>
  );
}
