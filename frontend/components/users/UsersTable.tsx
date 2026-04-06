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

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableCell key={i}>
          <div
            className="h-4 rounded bg-gray-200 animate-pulse"
            style={{ width: i === 0 ? "10rem" : i === 1 ? "12rem" : i === 2 ? "6rem" : "8rem" }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

function UserRow({ user, onEdit, onDelete }: UserRowProps) {
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
        <div className="text-sm">
          <p className="font-medium text-foreground">{user.product ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {user.product_value != null
              ? new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(user.product_value)
              : "Sem valor"}
          </p>
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(user)}
            className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Edit user"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Delete user"
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
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({
  users,
  isLoading,
  error,
  onEdit,
  onDelete,
}: UsersTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {error && (
          <div className="px-6 py-3 text-sm text-red-700">
            Failed to load users: {error.message}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Purchase</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : users?.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No users yet. Add your first user above.
                      </TableCell>
                    </TableRow>
                  )
                  : users?.map((user) => (
                      <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
                    ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
