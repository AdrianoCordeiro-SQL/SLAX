import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ChartPieSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-48 rounded bg-gray-200" />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="h-56 w-56 rounded-full bg-gray-200" />
      </CardContent>
    </Card>
  );
}
