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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePerformance } from "@/hooks/usePerformance";

function SkeletonChart() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-64 rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded bg-gray-200" />
      </CardContent>
    </Card>
  );
}

export function PerformanceChart() {
  const { data, isLoading, error } = usePerformance();

  if (isLoading) return <SkeletonChart />;

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load performance data: {error?.message ?? "Unknown error"}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Performance Over Time (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              formatter={(value: number, name: string) =>
                name === "latency" ? [`${value} ms`, "Latency"] : [value, "Requests"]
              }
              labelFormatter={(label: number) => `Day ${label}`}
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
      </CardContent>
    </Card>
  );
}
