"use client";

import {
  Activity,
  CalendarClock,
  DollarSign,
  HandCoins,
  RotateCcw,
  Users,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryMetricCardSkeleton } from "@/components/metrics/SummaryMetricCardSkeleton";
import { useStats } from "@/hooks/useStats";
import { useSparklines } from "@/hooks/useSparklines";
import type { SparklinePoint } from "@/lib/api/sparklines";
import {
  getChangeBadgeClasses,
  getChangeSparklineColor,
} from "@/lib/change-variant";
import { cn } from "@/lib/utils";

function formatLossPtBr(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyPtBr(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrencyPtBr(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatCurrencyPtBr(Math.abs(value))}`;
}

function getProfitValueClassName(value: number): string {
  return value >= 0
    ? "text-2xl font-bold leading-tight text-green-600 tabular-nums"
    : "text-2xl font-bold leading-tight text-red-600 tabular-nums";
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  sparklineData: SparklinePoint[];
  valueClassName?: string;
  changeNode?: React.ReactNode;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  sparklineData,
  valueClassName,
  changeNode,
}: StatCardProps) {
  const badgeClass = getChangeBadgeClasses(change);
  const lineColor = getChangeSparklineColor(change);

  return (
    <Card className="flex flex-col gap-2">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-md bg-[#1e2d5a]/10 p-1.5">
          <Icon size={16} className="text-[#1e2d5a]" />
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span
            className={cn(
              "text-2xl font-bold tracking-tight",
              valueClassName,
            )}
          >
            {value}
          </span>
          {changeNode ?? (
            <span
              className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
            >
              {change}
            </span>
          )}
        </div>
        <div className="h-12 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useStats();
  const { data: sparklines, isLoading: sparklinesLoading } = useSparklines();

  const isLoading = statsLoading || sparklinesLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SummaryMetricCardSkeleton key={i} withSparklinePlaceholder />
        ))}
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Falha ao carregar métricas: {statsError?.message ?? "Erro desconhecido"}
      </div>
    );
  }

  const empty: SparklinePoint[] = [];
  const transactionCountLabel =
    stats.api_requests === 1
      ? "1 compra registrada"
      : `${stats.api_requests.toLocaleString()} compras registradas`;
  const lossAmountFormatted = formatLossPtBr(stats.returns_lost_value);

  const cards: StatCardProps[] = [
    {
      title: "Clientes",
      value: stats.total_users.toLocaleString(),
      change: stats.users_change,
      icon: Users,
      sparklineData: sparklines?.users ?? empty,
    },
    {
      title: "Atividades recentes",
      value: stats.api_requests.toLocaleString(),
      change: transactionCountLabel,
      icon: Activity,
      sparklineData: sparklines?.requests ?? empty,
    },
    {
      title: "Perda",
      value: `-${lossAmountFormatted}`,
      change: "",
      valueClassName: "text-2xl font-bold leading-tight text-red-600 tabular-nums",
      changeNode: (
        <span className="text-xs font-semibold text-muted-foreground">
          Devoluções: {stats.returns_count.toLocaleString()}
        </span>
      ),
      icon: RotateCcw,
      sparklineData: empty,
    },
    {
      title: "Receita",
      value: formatCurrencyPtBr(stats.revenue),
      change: stats.revenue_change,
      icon: DollarSign,
      sparklineData: sparklines?.revenue ?? empty,
    },
    {
      title: "Lucro",
      value: formatSignedCurrencyPtBr(stats.profit),
      change: "",
      icon: HandCoins,
      sparklineData: empty,
      valueClassName: getProfitValueClassName(stats.profit),
      changeNode: (
        <span className="text-xs font-semibold text-muted-foreground">
          Vendas: {stats.api_requests.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Lucro Médio Mensal",
      value: formatSignedCurrencyPtBr(stats.monthly_avg_profit),
      change: "",
      icon: CalendarClock,
      sparklineData: empty,
      valueClassName: getProfitValueClassName(stats.monthly_avg_profit),
      changeNode: (
        <span className="text-xs font-semibold text-muted-foreground">
          Média dos últimos 12 meses
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
