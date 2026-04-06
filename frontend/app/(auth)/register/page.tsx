"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { AuthScreenShell } from "@/components/auth/AuthScreenShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { register } from "@/lib/api/auth";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      toast.success("Seu cadastro foi efetuado com sucesso!");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cadastro falhou");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthScreenShell className="py-8">
      <AuthBrandHeader title="Criar Conta" subtitle="Junte-se ao SLAX Pay (demo) hoje." />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-white/80">
            Nome completo
          </label>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-white/80">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
          />
        </div>

        <PasswordField
          id="password"
          label="Senha"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
          autoComplete="new-password"
        />

        <PasswordField
          id="confirm-password"
          label="Confirmar senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggleShow={() => setShowConfirm(!showConfirm)}
          autoComplete="new-password"
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-[#313235] hover:bg-[#3d3f42] text-white border-0 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Cadastrando…
            </>
          ) : (
            "Cadastrar"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-white/40">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-white/70 hover:text-white transition-colors font-medium">
          Faça login
        </Link>
      </p>
    </AuthScreenShell>
  );
}
