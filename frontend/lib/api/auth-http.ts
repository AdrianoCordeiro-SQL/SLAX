import { z } from "zod";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const accountSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  avatar_url: z.string().nullable(),
});

export const accountUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual"),
    new_password: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });

export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const loginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  account: accountSchema,
});

export type Account = z.infer<typeof accountSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (res.status === 409) {
    throw new Error("Este e-mail já está cadastrado");
  }
  if (!res.ok) {
    throw new Error(`Cadastro falhou: HTTP ${res.status}`);
  }

  const data = await res.json();
  return loginResponseSchema.parse(data);
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401) {
    throw new Error("Invalid email or password");
  }
  if (!res.ok) {
    throw new Error(`Login failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return loginResponseSchema.parse(data);
}

export async function fetchMe(token: string): Promise<Account> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch account: HTTP ${res.status}`);
  const data = await res.json();
  return accountSchema.parse(data);
}

export async function updateMe(
  token: string,
  payload: { name?: string; avatar_url?: string | null },
): Promise<Account> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update account: HTTP ${res.status}`);
  const data = await res.json();
  return accountSchema.parse(data);
}

export async function changePassword(
  token: string,
  payload: { current_password: string; new_password: string },
): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 400) {
    const data = await res.json();
    throw new Error(data.detail ?? "Senha atual incorreta");
  }
  if (res.status === 403) {
    const data = await res.json();
    throw new Error(data.detail ?? "Função bloqueada temporariamente");
  }
  if (!res.ok) throw new Error(`Failed to change password: HTTP ${res.status}`);
}
