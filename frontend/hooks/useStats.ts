import { useQuery } from "@tanstack/react-query";
import { fetchStats, type Stats } from "@/lib/api/stats";

export type { Stats };

export function useStats() {
  return useQuery<Stats, Error>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    staleTime: 30 * 1000,
  });
}
