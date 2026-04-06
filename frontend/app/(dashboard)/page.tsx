import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatsCards } from "@/components/dashboard/StatsCards";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">SLAX Pay / Overview</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Payment volume, success rate, and API health for the last 30 days
          (sample data in demo).
        </p>
      </div>
      <StatsCards />
      <PerformanceChart />
      <RecentActivity />
    </div>
  );
}
