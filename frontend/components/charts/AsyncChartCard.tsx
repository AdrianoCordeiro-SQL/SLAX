import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AsyncChartCardProps {
  title: string;
  isLoading: boolean;
  error: Error | null | undefined;
  /** When true, shows empty state with title (no chart body). Ignored while loading or on error. */
  empty?: boolean;
  /** Shown before ": {error.message}" */
  errorPrefix: string;
  emptyMessage?: string;
  skeleton: ReactNode;
  children: ReactNode;
}

export function AsyncChartCard({
  title,
  isLoading,
  error,
  empty = false,
  errorPrefix,
  emptyMessage = "Sem dados para este período",
  skeleton,
  children,
}: AsyncChartCardProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-sm text-red-700">
          {errorPrefix}: {error.message ?? "Erro desconhecido"}
        </CardContent>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
