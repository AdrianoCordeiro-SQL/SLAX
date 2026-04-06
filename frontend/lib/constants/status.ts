export const LOG_STATUSES = ["Success", "Pending", "Failed", "Error"] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

export const STATUS_BADGE_STYLES: Record<LogStatus, string> = {
  Success: "bg-green-100 text-green-700 border-green-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Failed: "bg-red-100 text-red-700 border-red-200",
  Error: "bg-red-100 text-red-700 border-red-200",
};

/** Devoluções (match com `backend` ilike `Produto % devolvido pelo cliente %`). */
const RETURN_ACTION_RE = /^Produto .+ devolvido pelo cliente .+$/i;

export function isReturnAction(action: string): boolean {
  return RETURN_ACTION_RE.test(action.trim());
}

export const LOG_STATUS_LABELS: Record<LogStatus, string> = {
  Success: "Concluída",
  Pending: "Pendente",
  Failed: "Falhou",
  Error: "Erro",
};

export const RETURN_BADGE_CLASS = STATUS_BADGE_STYLES.Failed;

export function getTransactionDisplayLabel(
  status: string,
  action?: string | null,
): string {
  if (action && isReturnAction(action)) return "Devolução";
  const key = status as LogStatus;
  if (key in LOG_STATUS_LABELS) return LOG_STATUS_LABELS[key];
  return status;
}

export const STATUS_CHART_COLORS: Record<string, string> = {
  "Vendas Realizadas": "#16a34a",
  "Devoluções": "#dc2626",
  Success: "#16a34a",
  Failed: "#dc2626",
  Error: "#dc2626",
  Pending: "#eab308",
};

export const FALLBACK_STATUS_BADGE = "bg-gray-100 text-gray-600 border-gray-200";
export const FALLBACK_CHART_COLOR = "#6b7280";
