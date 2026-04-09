import { useQuery } from "@tanstack/react-query";
import { fetchPerformance, type Performance } from "@/lib/api/performance";

export type { Performance };

export function usePerformance() {
  return useQuery<Performance, Error>({
    queryKey: ["performance"],
    queryFn: fetchPerformance,
    staleTime: 120 * 1000,
  });
}
