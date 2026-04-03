"use client";

import { useRef } from "react";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateAccount } from "@/hooks/useAccount";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface AvatarEditorProps {
  name: string;
  avatarUrl: string | null;
}

export function AvatarEditor({ name, avatarUrl }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateAccount, isPending } = useUpdateAccount();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateAccount({ avatar_url: base64 });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        className="relative group cursor-pointer"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        aria-label="Alterar foto de perfil"
      >
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl ?? ""} alt={name} />
          <AvatarFallback className="text-2xl font-bold bg-muted">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil size={20} className="text-white" />
        </span>
        {isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </span>
        )}
      </button>
      <p className="text-xs text-muted-foreground">Clique para alterar a foto</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
