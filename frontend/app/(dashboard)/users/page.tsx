"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { UserHistoryDialog } from "@/components/users/UserHistoryDialog";
import { UsersTable } from "@/components/users/UsersTable";
import { useUsers } from "@/hooks/useUsers";
import type { User } from "@/lib/api/users";

// Página de clientes com CRUD e acesso ao histórico individual em modal.

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [historyUser, setHistoryUser] = useState<User | null>(null);

  return (
    <>
      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      />
      <DeleteUserDialog
        user={deleteUser}
        onOpenChange={(open) => {
          if (!open) setDeleteUser(null);
        }}
      />
      <UserHistoryDialog
        user={historyUser}
        onOpenChange={(open) => {
          if (!open) setHistoryUser(null);
        }}
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os clientes e compras monitoradas na sua operação de e-commerce.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-[#1e2d5a] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e2d5a]/90 self-start sm:self-auto"
          >
            <UserPlus size={15} />
            Adicionar cliente
          </button>
        </div>

        <UsersTable
          users={users}
          isLoading={isLoading}
          error={error}
          onViewHistory={setHistoryUser}
          onEdit={setEditUser}
          onDelete={setDeleteUser}
        />
      </div>
    </>
  );
}
