import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ChartLineSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-48 rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded bg-gray-200" />
      </CardContent>
    </Card>
  );
}
