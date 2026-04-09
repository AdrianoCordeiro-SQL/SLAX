import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAlertRule,
  deleteAlertRule,
  evaluateAlerts,
  fetchAlertFirings,
  fetchAlertRules,
  updateAlertRule,
  type CreateAlertRuleInput,
  type UpdateAlertRuleInput,
} from "@/lib/api/alerts";

interface UseAlertFiringsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useAlertRules() {
  return useQuery({
    queryKey: ["alert-rules"],
    queryFn: fetchAlertRules,
    staleTime: 30_000,
  });
}

export function useAlertFirings(page: number, options: UseAlertFiringsOptions = {}) {
  return useQuery({
    queryKey: ["alert-firings", page],
    queryFn: () => fetchAlertFirings(page),
    staleTime: 60_000,
    enabled: options.enabled,
    refetchInterval: options.refetchInterval,
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlertRuleInput) => createAlertRule(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules"] });
    },
  });
}

export function useUpdateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAlertRuleInput }) =>
      updateAlertRule(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules"] });
    },
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAlertRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules"] });
      qc.invalidateQueries({ queryKey: ["alert-firings"] });
    },
  });
}

export function useEvaluateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: evaluateAlerts,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-firings"] });
    },
  });
}
