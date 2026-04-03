import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SummaryMetricCardSkeletonProps {
  /** Extra placeholder for sparkline area (dashboard stats) */
  withSparklinePlaceholder?: boolean;
}

export function SummaryMetricCardSkeleton({
  withSparklinePlaceholder = false,
}: SummaryMetricCardSkeletonProps) {
  return (
    <Card className="flex flex-col gap-2 animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-7 w-7 rounded-md bg-gray-200" />
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-20 rounded bg-gray-200" />
          <div className="h-4 w-12 rounded-full bg-gray-200" />
        </div>
        {withSparklinePlaceholder ? <div className="h-12 w-24 shrink-0 bg-gray-200" /> : null}
      </CardContent>
    </Card>
  );
}
