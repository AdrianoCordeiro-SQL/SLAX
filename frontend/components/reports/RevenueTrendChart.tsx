"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRevenueTrend } from "@/hooks/useReports";

function SkeletonChart() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-48 rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded bg-gray-200" />
      </CardContent>
    </Card>
  );
}

interface RevenueTrendChartProps {
  start: string;
  end: string;
}

export function RevenueTrendChart({ start, end }: RevenueTrendChartProps) {
  const { data, isLoading, error } = useRevenueTrend(start, end);

  if (isLoading) return <SkeletonChart />;

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-700">
          Failed to load revenue trend: {error?.message ?? "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No data for this period
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e2d5a" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#1e2d5a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              width={56}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
              labelFormatter={(label: string) => {
                const d = new Date(label);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1e2d5a"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#1e2d5a" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
