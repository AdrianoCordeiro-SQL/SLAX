"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { AuthPageLoading } from "@/components/auth/AuthPageLoading";
import { AuthScreenShell } from "@/components/auth/AuthScreenShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { login, loginAsDemo } from "@/lib/api/auth";

const ENABLE_DEMO_LOGIN = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const busy = isLoading || isDemoLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login falhou");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar como visitante.");
    } finally {
      setIsDemoLoading(false);
    }
  }

  return (
    <AuthScreenShell>
      <AuthBrandHeader
        title="SLAX Pay"
        subtitle="API de pagamentos para desenvolvedores (demo)."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
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
          labelRight={
            <span className="text-xs text-white/40 hover:text-white/60 cursor-pointer transition-colors">
              Esqueceu a senha?
            </span>
          }
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
          autoComplete="current-password"
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="w-full h-10 bg-[#313235] hover:bg-[#3d3f42] text-white border-0 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {ENABLE_DEMO_LOGIN ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={handleDemoLogin}
            className="w-full h-10 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            {isDemoLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Abrindo demonstração…
              </>
            ) : (
              "Entrar como visitante (dados de demonstração)"
            )}
          </Button>
          <p className="text-center text-xs text-white/45 leading-relaxed px-1">
            Conta partilhada para ver o painel com dados de exemplo. Prefere uma experiência própria?{" "}
            <Link href="/register" className="text-white/65 hover:text-white font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      ) : null}

      <p className="text-center text-sm text-white/40">
        Ainda não tem uma conta?{" "}
        <Link href="/register" className="text-white/70 hover:text-white transition-colors font-medium">
          Cadastre-se
        </Link>
      </p>
    </AuthScreenShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <LoginForm />
    </Suspense>
  );
}
