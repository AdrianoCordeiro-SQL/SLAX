import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchActivity, type ActivityResponse } from "@/lib/api/activity";

export type { ActivityResponse };

export function useActivity(page = 1, perPage = 20) {
  return useQuery<ActivityResponse, Error>({
    queryKey: ["activity", page, perPage],
    queryFn: () => fetchActivity(page, perPage),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
