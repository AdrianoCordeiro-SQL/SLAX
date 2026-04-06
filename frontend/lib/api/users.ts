import { z } from "zod";
import { apiFetch } from "./client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
});

export const usersSchema = z.array(userSchema);

export type User = z.infer<typeof userSchema>;
export type Users = z.infer<typeof usersSchema>;

export const createUserSchema = z.object({
  first_name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  last_name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  avatar_url: z.string().optional(),
  seed_demo_activity: z.boolean().default(false),
  demo_volume: z.enum(["light", "medium", "heavy"]).default("medium"),
});

export const editUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;

export async function fetchUsers(): Promise<Users> {
  const res = await apiFetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error(`Failed to fetch users: HTTP ${res.status}`);
  const data = await res.json();
  return usersSchema.parse(data);
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await apiFetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: input.first_name,
      last_name: input.last_name || null,
      email: input.email || null,
      avatar_url: input.avatar_url || null,
      seed_demo_activity: input.seed_demo_activity,
      demo_volume: input.demo_volume,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create user: HTTP ${res.status}`);
  const data = await res.json();
  return userSchema.parse(data);
}

export async function updateUser(userId: number, input: EditUserInput): Promise<User> {
  const res = await apiFetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: input.name,
      avatar_url: input.avatar_url || null,
    }),
  });
  if (!res.ok) throw new Error(`Failed to update user: HTTP ${res.status}`);
  const data = await res.json();
  return userSchema.parse(data);
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await apiFetch(`${API_BASE}/users/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete user: HTTP ${res.status}`);
}
