import { useQuery } from "@tanstack/react-query";
import { fetchActivity, type Activity } from "@/lib/api/activity";

export type { Activity };

export function useActivity() {
  return useQuery<Activity, Error>({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    staleTime: 15 * 1000,
  });
}
