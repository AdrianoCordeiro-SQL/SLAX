import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatsCards } from "@/components/dashboard/StatsCards";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">LogSlax Commerce Monitor / Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo de volta. Acompanhe eventos e receita da sua operação de e-commerce nos
          últimos 30 dias.
        </p>
      </div>
      <StatsCards />
      <PerformanceChart />
      <RecentActivity />
    </div>
  );
}
