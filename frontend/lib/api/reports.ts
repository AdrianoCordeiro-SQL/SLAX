import { z } from "zod";
import { LOG_STATUSES, type LogStatus } from "@/lib/constants/status";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function periodParams(start: string, end: string): string {
  return `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
}

// --- Summary ---

export const reportSummarySchema = z.object({
  total_requests: z.number(),
  requests_change: z.string(),
  success_rate: z.number(),
  success_rate_change: z.string(),
  total_revenue: z.number(),
  revenue_change: z.string(),
  active_users: z.number(),
  active_users_change: z.string(),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

export async function fetchReportSummary(start: string, end: string): Promise<ReportSummary> {
  const res = await fetch(`${API_BASE}/reports/summary?${periodParams(start, end)}`);
  if (!res.ok) throw new Error(`Failed to fetch report summary: HTTP ${res.status}`);
  return reportSummarySchema.parse(await res.json());
}

// --- Status Breakdown ---

export const statusBreakdownItemSchema = z.object({
  status: z.enum(LOG_STATUSES),
  count: z.number(),
});

export const statusBreakdownSchema = z.array(statusBreakdownItemSchema);

export type StatusBreakdownItem = z.infer<typeof statusBreakdownItemSchema>;

export async function fetchStatusBreakdown(start: string, end: string): Promise<StatusBreakdownItem[]> {
  const res = await fetch(`${API_BASE}/reports/status-breakdown?${periodParams(start, end)}`);
  if (!res.ok) throw new Error(`Failed to fetch status breakdown: HTTP ${res.status}`);
  return statusBreakdownSchema.parse(await res.json());
}

// --- Top Actions ---

export const topActionItemSchema = z.object({
  action: z.string(),
  count: z.number(),
});

export const topActionsSchema = z.array(topActionItemSchema);

export type TopActionItem = z.infer<typeof topActionItemSchema>;

export async function fetchTopActions(start: string, end: string): Promise<TopActionItem[]> {
  const res = await fetch(`${API_BASE}/reports/top-actions?${periodParams(start, end)}`);
  if (!res.ok) throw new Error(`Failed to fetch top actions: HTTP ${res.status}`);
  return topActionsSchema.parse(await res.json());
}

// --- Top Users ---

export const topUserItemSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  count: z.number(),
});

export const topUsersSchema = z.array(topUserItemSchema);

export type TopUserItem = z.infer<typeof topUserItemSchema>;

export async function fetchTopUsers(start: string, end: string): Promise<TopUserItem[]> {
  const res = await fetch(`${API_BASE}/reports/top-users?${periodParams(start, end)}`);
  if (!res.ok) throw new Error(`Failed to fetch top users: HTTP ${res.status}`);
  return topUsersSchema.parse(await res.json());
}

// --- Revenue Trend ---

export const revenueTrendPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const revenueTrendSchema = z.array(revenueTrendPointSchema);

export type RevenueTrendPoint = z.infer<typeof revenueTrendPointSchema>;

export async function fetchRevenueTrend(start: string, end: string): Promise<RevenueTrendPoint[]> {
  const res = await fetch(`${API_BASE}/reports/revenue-trend?${periodParams(start, end)}`);
  if (!res.ok) throw new Error(`Failed to fetch revenue trend: HTTP ${res.status}`);
  return revenueTrendSchema.parse(await res.json());
}

// --- Logs (paginated) ---

export const logItemSchema = z.object({
  id: z.number(),
  user: z.string(),
  avatar_url: z.string().nullable(),
  action: z.string(),
  timestamp: z.string(),
  status: z.enum(LOG_STATUSES),
});

export const logsResponseSchema = z.object({
  items: z.array(logItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
});

export type LogItem = z.infer<typeof logItemSchema>;
export type LogsResponse = z.infer<typeof logsResponseSchema>;

export interface LogFilters {
  status?: LogStatus;
  action?: string;
  user_id?: number;
  page?: number;
  per_page?: number;
}

export async function fetchReportLogs(
  start: string,
  end: string,
  filters: LogFilters = {},
): Promise<LogsResponse> {
  const params = new URLSearchParams();
  params.set("start", start);
  params.set("end", end);
  if (filters.status) params.set("status", filters.status);
  if (filters.action) params.set("action", filters.action);
  if (filters.user_id !== undefined) params.set("user_id", String(filters.user_id));
  params.set("page", String(filters.page ?? 1));
  params.set("per_page", String(filters.per_page ?? 20));

  const res = await fetch(`${API_BASE}/reports/logs?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch report logs: HTTP ${res.status}`);
  return logsResponseSchema.parse(await res.json());
}
