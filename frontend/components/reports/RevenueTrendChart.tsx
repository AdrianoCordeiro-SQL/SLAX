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
import { AsyncChartCard } from "@/components/charts/AsyncChartCard";
import { ChartLineSkeleton } from "@/components/charts/ChartLineSkeleton";
import { useRevenueTrend } from "@/hooks/useReports";

interface RevenueTrendChartProps {
  start: string;
  end: string;
}

export function RevenueTrendChart({ start, end }: RevenueTrendChartProps) {
  const { data, isLoading, error } = useRevenueTrend(start, end);
  const empty = !data?.length;

  return (
    <AsyncChartCard
      title="Tendência de receita"
      isLoading={isLoading}
      error={error}
      empty={empty}
      errorPrefix="Falha ao carregar tendência de receita"
      skeleton={<ChartLineSkeleton />}
    >
      {data && data.length > 0 ? (
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
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                }).format(v)
              }
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
                return [
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(num),
                  "Receita",
                ];
              }}
              labelFormatter={(label) => {
                const s = typeof label === "string" ? label : String(label);
                const d = new Date(s);
                return d.toLocaleDateString("pt-BR", {
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
      ) : null}
    </AsyncChartCard>
  );
}
