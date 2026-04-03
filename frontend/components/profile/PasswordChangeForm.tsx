"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/useAccount";
import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/api/auth";

export function PasswordChangeForm() {
  const { mutate: changePwd, isPending, isSuccess, isError, error, reset: resetMutation } =
    useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  function onSubmit(data: PasswordChangeInput) {
    changePwd(
      { current_password: data.current_password, new_password: data.new_password },
      {
        onSuccess: () => {
          reset();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current_password">Senha atual</Label>
        <Input
          id="current_password"
          type="password"
          autoComplete="current-password"
          {...register("current_password")}
        />
        {errors.current_password && (
          <p className="text-xs text-red-600">{errors.current_password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new_password">Nova senha</Label>
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          {...register("new_password")}
        />
        {errors.new_password && (
          <p className="text-xs text-red-600">{errors.new_password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirmar nova senha</Label>
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          {...register("confirm_password")}
        />
        {errors.confirm_password && (
          <p className="text-xs text-red-600">{errors.confirm_password.message}</p>
        )}
      </div>

      {isSuccess && (
        <p className="text-sm text-green-600">Senha alterada com sucesso.</p>
      )}
      {isError && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      <Button type="submit" disabled={isPending} onClick={() => resetMutation()}>
        {isPending ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
