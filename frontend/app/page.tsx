import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatsCards } from "@/components/dashboard/StatsCards";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard / Overview</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, Admin. Here&apos;s what&apos;s happening today.
        </p>
      </div>
      <StatsCards />
      <PerformanceChart />
      <RecentActivity />
    </div>
  );
}
