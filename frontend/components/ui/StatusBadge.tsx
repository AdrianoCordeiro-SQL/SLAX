import { Badge } from "@/components/ui/badge";
import {
  FALLBACK_STATUS_BADGE,
  STATUS_BADGE_STYLES,
} from "@/lib/constants/status";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls =
    STATUS_BADGE_STYLES[status as keyof typeof STATUS_BADGE_STYLES] ??
    FALLBACK_STATUS_BADGE;
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  );
}
