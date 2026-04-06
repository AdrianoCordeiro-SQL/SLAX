import { z } from "zod";
import { LOG_STATUSES } from "@/lib/constants/status";
import { apiFetch } from "./client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const activityItemSchema = z.object({
  id: z.number(),
  user: z.string(),
  avatar_url: z.string().nullable(),
  action: z.string(),
  timestamp: z.string(),
  status: z.enum(LOG_STATUSES),
});

export const activitySchema = z.array(activityItemSchema);
export const activityResponseSchema = z.object({
  items: activitySchema,
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ActivityResponse = z.infer<typeof activityResponseSchema>;

export async function fetchActivity(page = 1, perPage = 20): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  const res = await apiFetch(`${API_BASE}/activity?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch activity: HTTP ${res.status}`);
  const data = await res.json();
  return activityResponseSchema.parse(data);
}
