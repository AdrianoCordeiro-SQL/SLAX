"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAccount } from "@/hooks/useAccount";
import { accountUpdateSchema, type AccountUpdateInput } from "@/lib/api/auth";

interface ProfileInfoFormProps {
  name: string;
  email: string;
}

export function ProfileInfoForm({ name, email }: ProfileInfoFormProps) {
  const { mutate: updateAccount, isPending, isSuccess, isError, error } = useUpdateAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountUpdateInput>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: { name },
  });

  useEffect(() => {
    reset({ name });
  }, [name, reset]);

  function onSubmit(data: AccountUpdateInput) {
    updateAccount({ name: data.name });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
        <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
      </div>

      {isSuccess && (
        <p className="text-sm text-green-600">Perfil atualizado com sucesso.</p>
      )}
      {isError && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
