"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/lib/api/users";
import { formatShortDate, getInitials } from "@/lib/format";

// Tabela de clientes com ações de edição, exclusão e abertura do histórico individual.

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableCell key={i}>
          <div
            className="h-4 rounded bg-gray-200 animate-pulse"
            style={{ width: i === 0 ? "10rem" : i === 1 ? "6rem" : "8rem" }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

interface UserRowProps {
  user: User;
  onViewHistory: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

function UserRow({ user, onViewHistory, onEdit, onDelete }: UserRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            )}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{user.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          #{user.id}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatShortDate(user.created_at)}
      </TableCell>
      <TableCell>
        <button
          type="button"
          onClick={() => onViewHistory(user)}
          className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
        >
          Ver
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(user)}
            className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Editar cliente"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Excluir cliente"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface UsersTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onViewHistory: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({
  users,
  isLoading,
  error,
  onViewHistory,
  onEdit,
  onDelete,
}: UsersTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {error && (
          <div className="px-6 py-3 text-sm text-red-700">
            Falha ao carregar clientes: {error.message}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Cliente</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : users?.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Ainda não há clientes cadastrados. Adicione o primeiro cliente acima.
                      </TableCell>
                    </TableRow>
                  )
                  : users?.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        onViewHistory={onViewHistory}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
