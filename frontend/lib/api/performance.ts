import { z } from "zod";
import { authFetch } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const performancePointSchema = z.object({
  day: z.number(),
  requests: z.number(),
  latency: z.number(),
});

export const performanceSchema = z.array(performancePointSchema);

export type PerformancePoint = z.infer<typeof performancePointSchema>;
export type Performance = z.infer<typeof performanceSchema>;

export async function fetchPerformance(): Promise<Performance> {
  const res = await authFetch(`${API_BASE}/performance`);
  if (!res.ok) throw new Error(`Failed to fetch performance: HTTP ${res.status}`);
  const data = await res.json();
  return performanceSchema.parse(data);
}
