import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchReportSummary,
  fetchStatusBreakdown,
  fetchTopActions,
  fetchTopUsers,
  fetchRevenueTrend,
  fetchReportLogs,
  type ReportSummary,
  type StatusBreakdownItem,
  type TopActionItem,
  type TopUserItem,
  type RevenueTrendPoint,
  type LogsResponse,
  type LogFilters,
} from "@/lib/api/reports";

export function useReportSummary(start: string, end: string) {
  return useQuery<ReportSummary, Error>({
    queryKey: ["report-summary", start, end],
    queryFn: () => fetchReportSummary(start, end),
    staleTime: 30_000,
  });
}

export function useStatusBreakdown(start: string, end: string) {
  return useQuery<StatusBreakdownItem[], Error>({
    queryKey: ["report-status-breakdown", start, end],
    queryFn: () => fetchStatusBreakdown(start, end),
    staleTime: 30_000,
  });
}

export function useTopActions(start: string, end: string) {
  return useQuery<TopActionItem[], Error>({
    queryKey: ["report-top-actions", start, end],
    queryFn: () => fetchTopActions(start, end),
    staleTime: 30_000,
  });
}

export function useTopUsers(start: string, end: string) {
  return useQuery<TopUserItem[], Error>({
    queryKey: ["report-top-users", start, end],
    queryFn: () => fetchTopUsers(start, end),
    staleTime: 30_000,
  });
}

export function useRevenueTrend(start: string, end: string) {
  return useQuery<RevenueTrendPoint[], Error>({
    queryKey: ["report-revenue-trend", start, end],
    queryFn: () => fetchRevenueTrend(start, end),
    staleTime: 30_000,
  });
}

export function useReportLogs(start: string, end: string, filters: LogFilters = {}) {
  return useQuery<LogsResponse, Error>({
    queryKey: ["report-logs", start, end, filters],
    queryFn: () => fetchReportLogs(start, end, filters),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
