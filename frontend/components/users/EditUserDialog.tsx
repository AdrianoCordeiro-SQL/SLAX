"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateUser } from "@/hooks/useUsers";
import { editUserSchema, type EditUserInput, type User } from "@/lib/api/users";

interface EditUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, onOpenChange }: EditUserDialogProps) {
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
