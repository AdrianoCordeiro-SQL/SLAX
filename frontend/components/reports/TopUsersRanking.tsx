"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopUsers } from "@/hooks/useReports";
import { getInitials } from "@/lib/format";

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="ml-auto h-4 w-12 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

interface TopUsersRankingProps {
  start: string;
  end: string;
}

export function TopUsersRanking({ start, end }: TopUsersRankingProps) {
  const { data, isLoading, error } = useTopUsers(start, end);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Clientes mais ativos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <SkeletonRows />}

        {error && (
          <p className="text-sm text-red-700">
            Falha ao carregar clientes mais ativos: {error.message}
          </p>
        )}

        {data && data.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem dados para este período
          </p>
        )}

        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((user, idx) => (
              <div key={user.user_id} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <Avatar size="sm">
                  {user.avatar_url && (
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                  )}
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {user.count.toLocaleString()} eventos
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
