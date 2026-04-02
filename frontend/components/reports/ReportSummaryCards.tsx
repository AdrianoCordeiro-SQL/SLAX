"use client";

import { Activity, CheckCircle2, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportSummary } from "@/hooks/useReports";

function getChangeVariant(change: string): string {
  if (change.startsWith("+")) return "bg-green-100 text-green-700";
  if (change.startsWith("-")) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

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
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getChangeVariant(change)}`}
          >
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="flex flex-col gap-2 animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-7 w-7 rounded-md bg-gray-200" />
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-20 rounded bg-gray-200" />
          <div className="h-4 w-12 rounded-full bg-gray-200" />
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
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load report summary: {error?.message ?? "Unknown error"}
      </div>
    );
  }

  const cards: SummaryCardProps[] = [
    {
      title: "Total Requests",
      value: data.total_requests.toLocaleString(),
      change: data.requests_change,
      icon: Activity,
    },
    {
      title: "Success Rate",
      value: `${data.success_rate}%`,
      change: data.success_rate_change,
      icon: CheckCircle2,
    },
    {
      title: "Revenue",
      value: `$${data.total_revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: data.revenue_change,
      icon: DollarSign,
    },
    {
      title: "Active Users",
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
