import { useQuery } from "@tanstack/react-query";
import { fetchSparklines, type Sparklines } from "@/lib/api/sparklines";

export type { Sparklines };

export function useSparklines() {
  return useQuery<Sparklines, Error>({
    queryKey: ["sparklines"],
    queryFn: fetchSparklines,
    staleTime: 120 * 1000,
  });
}
