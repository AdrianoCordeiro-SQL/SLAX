import { z } from "zod";
import { apiFetch } from "./client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ruleTypeSchema = z.enum(["returns_rate_above", "revenue_drop", "days_without_purchase"]);

export const alertRuleSchema = z.object({
  id: z.number(),
  account_id: z.number(),
  rule_type: ruleTypeSchema,
  params: z.record(z.string(), z.unknown()),
  enabled: z.boolean(),
  cooldown_hours: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AlertRule = z.infer<typeof alertRuleSchema>;
export type AlertRuleType = z.infer<typeof ruleTypeSchema>;

export const evaluateResponseSchema = z.object({
  fired: z.array(
    z.object({
      rule_id: z.number(),
      firing_id: z.number(),
      message: z.string(),
    }),
  ),
});

export type EvaluateResponse = z.infer<typeof evaluateResponseSchema>;

export const alertFiringsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      rule_id: z.number(),
      fired_at: z.string(),
      message: z.string(),
      snapshot: z.record(z.string(), z.unknown()),
      notified: z.boolean(),
    }),
  ),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
});

export type AlertFiringsResponse = z.infer<typeof alertFiringsResponseSchema>;

export async function fetchAlertRules(): Promise<AlertRule[]> {
  const res = await apiFetch(`${API_BASE}/alerts/rules`);
  if (!res.ok) throw new Error(`Falha ao carregar regras: HTTP ${res.status}`);
  const data = await res.json();
  return z.array(alertRuleSchema).parse(data);
}

export interface CreateAlertRuleInput {
  rule_type: AlertRuleType;
  params: Record<string, unknown>;
  enabled: boolean;
  cooldown_hours: number;
}

export async function createAlertRule(input: CreateAlertRuleInput): Promise<AlertRule> {
  const res = await apiFetch(`${API_BASE}/alerts/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = typeof err?.detail === "string" ? err.detail : `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return alertRuleSchema.parse(await res.json());
}

export interface UpdateAlertRuleInput {
  rule_type?: AlertRuleType;
  params?: Record<string, unknown>;
  enabled?: boolean;
  cooldown_hours?: number;
}

export async function updateAlertRule(
  id: number,
  input: UpdateAlertRuleInput,
): Promise<AlertRule> {
  const res = await apiFetch(`${API_BASE}/alerts/rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = typeof err?.detail === "string" ? err.detail : `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return alertRuleSchema.parse(await res.json());
}

export async function deleteAlertRule(id: number): Promise<void> {
  const res = await apiFetch(`${API_BASE}/alerts/rules/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Falha ao excluir regra: HTTP ${res.status}`);
}

export async function evaluateAlerts(): Promise<EvaluateResponse> {
  const res = await apiFetch(`${API_BASE}/alerts/evaluate`, { method: "POST" });
  if (!res.ok) throw new Error(`Falha ao avaliar alertas: HTTP ${res.status}`);
  return evaluateResponseSchema.parse(await res.json());
}

export async function fetchAlertFirings(page: number, perPage = 20): Promise<AlertFiringsResponse> {
  const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const res = await apiFetch(`${API_BASE}/alerts/firings?${q}`);
  if (!res.ok) throw new Error(`Falha ao carregar disparos: HTTP ${res.status}`);
  return alertFiringsResponseSchema.parse(await res.json());
}

export function ruleTypeLabel(t: AlertRuleType): string {
  switch (t) {
    case "returns_rate_above":
      return "Taxa de devoluções";
    case "revenue_drop":
      return "Queda de receita";
    case "days_without_purchase":
      return "Dias sem compra";
    default:
      return t;
  }
}

export function defaultParamsForType(t: AlertRuleType): Record<string, number> {
  switch (t) {
    case "returns_rate_above":
      return { window_days: 7, max_percent: 10, min_events: 5 };
    case "revenue_drop":
      return { window_days: 7, drop_percent: 20 };
    case "days_without_purchase":
      return { min_days: 7 };
    default:
      return {};
  }
}
