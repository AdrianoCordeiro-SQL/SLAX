"use client";

import { Activity, Database, DollarSign, Users } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStats } from "@/hooks/useStats";

const SPARKLINES: Record<string, { value: number }[]> = {
  users: [
    { value: 4 }, { value: 6 }, { value: 5 }, { value: 8 },
    { value: 7 }, { value: 9 }, { value: 11 },
  ],
  requests: [
    { value: 30 }, { value: 45 }, { value: 38 }, { value: 52 },
    { value: 48 }, { value: 60 }, { value: 55 },
  ],
  health: [
    { value: 98 }, { value: 99 }, { value: 97 }, { value: 100 },
    { value: 99 }, { value: 98 }, { value: 100 },
  ],
  revenue: [
    { value: 120 }, { value: 180 }, { value: 150 }, { value: 210 },
    { value: 195 }, { value: 230 }, { value: 250 },
  ],
};

function getChangeVariant(change: string): string {
  if (change.startsWith("+")) return "bg-green-100 text-green-700";
  if (change.startsWith("-")) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function getSparklineColor(change: string): string {
  if (change.startsWith("+")) return "#16a34a";
  if (change.startsWith("-")) return "#dc2626";
  return "#6b7280";
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  sparklineKey: string;
}

function StatCard({ title, value, change, icon: Icon, sparklineKey }: StatCardProps) {
  const badgeClass = getChangeVariant(change);
  const lineColor = getSparklineColor(change);
  const data = SPARKLINES[sparklineKey];

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
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
          >
            {change}
          </span>
        </div>
        <div className="h-12 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
        <div className="h-12 w-24 rounded bg-gray-200" />
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load stats: {error?.message ?? "Unknown error"}
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      title: "Total Users",
      value: stats.total_users.toLocaleString(),
      change: stats.users_change,
      icon: Users,
      sparklineKey: "users",
    },
    {
      title: "API Requests",
      value: stats.api_requests.toLocaleString(),
      change: stats.requests_change,
      icon: Activity,
      sparklineKey: "requests",
    },
    {
      title: "Database Health",
      value: stats.db_health,
      change: stats.db_health_change,
      icon: Database,
      sparklineKey: "health",
    },
    {
      title: "Revenue",
      value: `$${stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: stats.revenue_change,
      icon: DollarSign,
      sparklineKey: "revenue",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
