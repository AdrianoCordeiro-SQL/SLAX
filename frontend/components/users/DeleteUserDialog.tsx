"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteUser } from "@/hooks/useUsers";
import type { User } from "@/lib/api/users";

interface DeleteUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({ user, onOpenChange }: DeleteUserDialogProps) {
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
