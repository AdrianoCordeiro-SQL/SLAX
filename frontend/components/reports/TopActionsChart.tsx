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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopActions } from "@/hooks/useReports";

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

interface TopActionsChartProps {
  start: string;
  end: string;
}

export function TopActionsChart({ start, end }: TopActionsChartProps) {
  const { data, isLoading, error } = useTopActions(start, end);

  if (isLoading) return <SkeletonChart />;

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-700">
          Failed to load top actions: {error?.message ?? "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Actions</CardTitle>
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
        <CardTitle className="text-base font-semibold">Top Actions</CardTitle>
      </CardHeader>
      <CardContent>
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
                return [num, "Requests"];
              }}
            />
            <Bar dataKey="count" fill="#1e2d5a" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
