"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { useAccount } from "@/hooks/useAccount";

function SkeletonSection() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { data: account, isLoading, error } = useAccount();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-7 w-32 rounded bg-muted animate-pulse" />
        <div className="flex justify-center py-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
        </div>
        <SkeletonSection />
        <SkeletonSection />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-red-600">
          Erro ao carregar perfil: {error?.message ?? "Desconhecido"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas informações pessoais e segurança da conta.
        </p>
      </div>

      <div className="flex justify-center py-2">
        <AvatarEditor name={account.name} avatarUrl={account.avatar_url} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileInfoForm name={account.name} email={account.email} />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}
