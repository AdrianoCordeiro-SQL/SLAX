"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActivity } from "@/hooks/useActivity";
import type { ActivityItem } from "@/lib/api/activity";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Success: "bg-green-100 text-green-700 border-green-200",
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Failed: "bg-red-100 text-red-700 border-red-200",
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {item.avatar_url && (
              <AvatarImage src={item.avatar_url} alt={item.user} />
            )}
            <AvatarFallback>{getInitials(item.user)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{item.user}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs">
        {item.action}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatTimestamp(item.timestamp)}
      </TableCell>
      <TableCell>
        <StatusBadge status={item.status} />
      </TableCell>
    </TableRow>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded bg-gray-200 animate-pulse" style={{ width: i === 0 ? "8rem" : i === 1 ? "10rem" : "6rem" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function RecentActivity() {
  const { data: activity, isLoading, error } = useActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-6 py-3 text-sm text-red-700">
            Failed to load activity: {error.message}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : activity?.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
