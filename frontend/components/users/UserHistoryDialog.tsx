"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUserActivity } from "@/hooks/useUsers";
import type { User } from "@/lib/api/users";
import { getInitials } from "@/lib/format";

// Modal de histórico que lista, em ordem recente, todas as atividades de um cliente.

interface UserHistoryDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserHistoryDialog({ user, onOpenChange }: UserHistoryDialogProps) {
  const { data, isLoading, error } = useUserActivity(user?.id ?? null);

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de atividades</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
          )}

          {error && (
            <p className="text-sm text-red-700">
              Falha ao carregar histórico: {error.message}
            </p>
          )}

          {!isLoading && !error && data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade encontrada para este cliente.
            </p>
          )}

          {!isLoading &&
            !error &&
            data?.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-background px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar size="sm">
                      {item.avatar_url && (
                        <AvatarImage src={item.avatar_url} alt={item.user || "Não informado"} />
                      )}
                      <AvatarFallback>{getInitials(item.user || "Não informado")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.user || user?.name || "Cliente"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} action={item.action} />
                </div>
                <p className="mt-2 text-xs font-mono text-muted-foreground">{item.action}</p>
              </div>
            ))}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
