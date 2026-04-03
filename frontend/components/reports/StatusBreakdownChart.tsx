"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatusBreakdown } from "@/hooks/useReports";
import { FALLBACK_CHART_COLOR, STATUS_CHART_COLORS } from "@/lib/constants/status";

function SkeletonChart() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-48 rounded bg-gray-200" />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="h-56 w-56 rounded-full bg-gray-200" />
      </CardContent>
    </Card>
  );
}

interface StatusBreakdownChartProps {
  start: string;
  end: string;
}

export function StatusBreakdownChart({ start, end }: StatusBreakdownChartProps) {
  const { data, isLoading, error } = useStatusBreakdown(start, end);

  if (isLoading) return <SkeletonChart />;

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-700">
          Failed to load status breakdown: {error?.message ?? "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
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
        <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_CHART_COLORS[entry.status] ?? FALLBACK_CHART_COLOR}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
