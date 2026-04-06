"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateUser } from "@/hooks/useUsers";
import { createUserSchema, type CreateUserInput } from "@/lib/api/users";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50";

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { mutate: create, isPending } = useCreateUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      seed_demo_activity: false,
      demo_volume: "medium",
    },
  });

  const seedDemo = watch("seed_demo_activity");

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

          <div className="space-y-3 rounded-md border border-border bg-muted/30 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
                checked={!!seedDemo}
                onChange={(e) => setValue("seed_demo_activity", e.target.checked)}
              />
              <span className="text-sm leading-snug">
                <span className="font-medium text-foreground">Gerar atividade de demonstração</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Cria eventos de pagamento e receita{" "}
                  <span className="font-medium text-foreground">fictícios</span> nos últimos 30 dias só
                  para preencher gráficos e métricas do dashboard (portfólio / demo).
                </span>
              </span>
            </label>

            <div className="space-y-1.5 pl-7">
              <label className="text-sm font-medium text-foreground" htmlFor="add-demo-volume">
                Perfil de volume
              </label>
              <select
                id="add-demo-volume"
                disabled={!seedDemo}
                className={inputClass + (seedDemo ? "" : " opacity-60 cursor-not-allowed")}
                {...register("demo_volume")}
              >
                <option value="light">Leve</option>
                <option value="medium">Médio</option>
                <option value="heavy">Pesado</option>
              </select>
            </div>
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
