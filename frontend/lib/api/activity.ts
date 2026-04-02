import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const activityItemSchema = z.object({
  id: z.number(),
  user: z.string(),
  avatar_url: z.string().nullable(),
  action: z.string(),
  timestamp: z.string(),
  status: z.string(),
});

export const activitySchema = z.array(activityItemSchema);

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type Activity = z.infer<typeof activitySchema>;

export async function fetchActivity(): Promise<Activity> {
  const res = await fetch(`${API_BASE}/activity`);
  if (!res.ok) throw new Error(`Failed to fetch activity: HTTP ${res.status}`);
  const data = await res.json();
  return activitySchema.parse(data);
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete user: HTTP ${res.status}`);
}

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export async function createUser(input: CreateUserInput): Promise<void> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create user: HTTP ${res.status}`);
}
