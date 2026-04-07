import { z } from "zod";
import { apiFetch } from "./client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const statsSchema = z.object({
  total_users: z.number(),
  users_change: z.string(),
  api_requests: z.number(),
  requests_change: z.string(),
  revenue: z.number(),
  revenue_change: z.string(),
  returns_count: z.number(),
  returns_lost_value: z.number(),
  profit: z.number(),
  monthly_avg_profit: z.number(),
});

export type Stats = z.infer<typeof statsSchema>;

export async function fetchStats(): Promise<Stats> {
  const res = await apiFetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: HTTP ${res.status}`);
  const data = await res.json();
  return statsSchema.parse(data);
}
