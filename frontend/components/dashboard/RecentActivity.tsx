"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getInitials } from "@/lib/format";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAction(action: string): string {
  const purchaseMatch = action.match(/^POST \/users \(purchase: (.+) - \$(\d+(?:\.\d{1,2})?)\)$/);
  if (purchaseMatch) {
    const [, product, rawValue] = purchaseMatch;
    const value = Number(rawValue);
    return `Compra registrada: ${product} (${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)})`;
  }
  return action;
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
        {formatAction(item.action)}
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
          Atividade recente da plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-6 py-3 text-sm text-red-700">
            Falha ao carregar atividade: {error.message}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Cliente</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Horário</TableHead>
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
