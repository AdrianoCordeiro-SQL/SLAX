"use client";

import { Activity, DollarSign, RotateCcw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryMetricCardSkeleton } from "@/components/metrics/SummaryMetricCardSkeleton";
import { useReportSummary } from "@/hooks/useReports";
import { getChangeBadgeClasses } from "@/lib/change-variant";

interface SummaryCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

function SummaryCard({ title, value, change, icon: Icon }: SummaryCardProps) {
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
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          <span
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getChangeBadgeClasses(change)}`}
          >
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportSummaryCardsProps {
  start: string;
  end: string;
}

export function ReportSummaryCards({ start, end }: ReportSummaryCardsProps) {
  const { data, isLoading, error } = useReportSummary(start, end);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SummaryMetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Falha ao carregar resumo dos relatórios: {error?.message ?? "Erro desconhecido"}
      </div>
    );
  }

  const transactionCountLabel =
    data.total_requests === 1
      ? "1 transação no período"
      : `${data.total_requests.toLocaleString()} transações no período`;

  const cards: SummaryCardProps[] = [
    {
      title: "Atividades recentes",
      value: data.total_requests.toLocaleString(),
      change: transactionCountLabel,
      icon: Activity,
    },
    {
      title: "Receita",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(data.total_revenue),
      change: data.revenue_change,
      icon: DollarSign,
    },
    {
      title: "Devoluções",
      value: data.returns_count.toLocaleString(),
      change: `Perda: ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(data.returns_lost_value)}`,
      icon: RotateCcw,
    },
    {
      title: "Clientes ativos",
      value: data.active_users.toLocaleString(),
      change: data.active_users_change,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}
