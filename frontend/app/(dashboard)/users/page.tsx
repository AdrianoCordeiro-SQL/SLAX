"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2, Upload, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "@/hooks/useUsers";
import {
  createUserSchema,
  editUserSchema,
  type CreateUserInput,
  type EditUserInput,
  type User,
} from "@/lib/api/users";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// --- Add User Dialog ---

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50";

function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { mutate: create, isPending } = useCreateUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setValue("avatar_url", base64);
    };
    reader.readAsDataURL(file);
  }

  function onSubmit(values: CreateUserInput) {
    create(values, {
      onSuccess: () => {
        resetForm();
        setAvatarPreview(null);
        onOpenChange(false);
      },
    });
  }

  function handleClose(next: boolean) {
    if (!next) {
      resetForm();
      setAvatarPreview(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">

          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
              aria-label="Selecionar foto"
            >
              <Avatar className="h-20 w-20">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Preview" />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Upload size={24} />
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={18} className="text-white" />
              </span>
            </button>
            <p className="text-xs text-muted-foreground">
              {avatarPreview ? "Foto selecionada — clique para trocar" : "Clique para adicionar foto"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Nome + Sobrenome lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="add-first-name">
                Nome
              </label>
              <input
                id="add-first-name"
                placeholder="Jane"
                {...register("first_name")}
                className={inputClass}
              />
              {errors.first_name && (
                <p className="text-xs text-red-600">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="add-last-name">
                Sobrenome <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                id="add-last-name"
                placeholder="Doe"
                {...register("last_name")}
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="add-email">
              Email <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              id="add-email"
              type="email"
              placeholder="jane@exemplo.com"
              {...register("email")}
              className={inputClass}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#1e2d5a] hover:bg-[#1e2d5a]/90"
            >
              {isPending ? "Adicionando…" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit User Dialog ---

interface EditUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

function EditUserDialog({ user, onOpenChange }: EditUserDialogProps) {
  const { mutate: update, isPending } = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    values: {
      name: user?.name ?? "",
      avatar_url: user?.avatar_url ?? "",
    },
  });

  function onSubmit(values: EditUserInput) {
    if (!user) return;
    update(
      { id: user.id, input: values },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="edit-name">
              Name
            </label>
            <input
              id="edit-name"
              placeholder="Jane Doe"
              {...register("name")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="edit-avatar">
              Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="edit-avatar"
              type="url"
              placeholder="https://example.com/avatar.png"
              {...register("avatar_url")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
            {errors.avatar_url && (
              <p className="text-xs text-red-600">{errors.avatar_url.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#1e2d5a] hover:bg-[#1e2d5a]/90"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Skeleton Row ---

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 4 }).map((_, i) => (
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

// --- Delete Confirmation Dialog ---

interface DeleteConfirmDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

function DeleteConfirmDialog({ user, onOpenChange }: DeleteConfirmDialogProps) {
  const { mutate: remove, isPending } = useDeleteUser();

  function handleConfirm() {
    if (!user) return;
    remove(user.id, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{user?.name}</span>?
          This action cannot be undone.
        </p>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- User Row ---

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
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          #{user.id}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDate(user.created_at)}
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

// --- Page ---

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  return (
    <>
      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditUserDialog user={editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }} />
      <DeleteConfirmDialog user={deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage all registered users in the system.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-[#1e2d5a] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e2d5a]/90 self-start sm:self-auto"
          >
            <UserPlus size={15} />
            Add User
          </button>
        </div>

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
                    <TableHead className="pl-6">User</TableHead>
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
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          No users yet. Add your first user above.
                        </TableCell>
                      </TableRow>
                    )
                    : users?.map((user) => (
                        <UserRow key={user.id} user={user} onEdit={setEditUser} onDelete={setDeleteUser} />
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
