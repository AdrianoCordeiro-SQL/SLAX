import { Badge } from "@/components/ui/badge";
import {
  FALLBACK_STATUS_BADGE,
  RETURN_BADGE_CLASS,
  STATUS_BADGE_STYLES,
  getTransactionDisplayLabel,
  isReturnAction,
} from "@/lib/constants/status";

interface StatusBadgeProps {
  status: string;
  action?: string | null;
}

export function StatusBadge({ status, action }: StatusBadgeProps) {
  const label = getTransactionDisplayLabel(status, action);
  const cls =
    action && isReturnAction(action)
      ? RETURN_BADGE_CLASS
      : (STATUS_BADGE_STYLES[status as keyof typeof STATUS_BADGE_STYLES] ??
        FALLBACK_STATUS_BADGE);
  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}
