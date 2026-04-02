import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TOKEN_COOKIE = "slax-token";

export const accountSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  account: accountSchema,
});

export type Account = z.infer<typeof accountSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export async function login(email: string, password: string): Promise<LoginResponse> {
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
  const parsed = loginResponseSchema.parse(data);

  document.cookie = `${TOKEN_COOKIE}=${parsed.access_token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

  return parsed;
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function logout() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export async function fetchMe(token: string): Promise<Account> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch account: HTTP ${res.status}`);
  const data = await res.json();
  return accountSchema.parse(data);
}
