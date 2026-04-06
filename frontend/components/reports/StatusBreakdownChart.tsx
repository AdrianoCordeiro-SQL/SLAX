"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AsyncChartCard } from "@/components/charts/AsyncChartCard";
import { ChartPieSkeleton } from "@/components/charts/ChartPieSkeleton";
import { useStatusBreakdown } from "@/hooks/useReports";
import { FALLBACK_CHART_COLOR, STATUS_CHART_COLORS } from "@/lib/constants/status";

interface StatusBreakdownChartProps {
  start: string;
  end: string;
}

export function StatusBreakdownChart({ start, end }: StatusBreakdownChartProps) {
  const { data, isLoading, error } = useStatusBreakdown(start, end);
  const total = (data ?? []).reduce((acc, item) => acc + item.count, 0);
  const empty = !data?.length || total === 0;

  return (
    <AsyncChartCard
      title="Distribuição por status"
      isLoading={isLoading}
      error={error}
      empty={empty}
      errorPrefix="Falha ao carregar distribuição por status"
      skeleton={<ChartPieSkeleton />}
    >
      {data && data.length > 0 ? (
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
              formatter={(value: number, name: string) => [value, name]}
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
      ) : null}
    </AsyncChartCard>
  );
}
