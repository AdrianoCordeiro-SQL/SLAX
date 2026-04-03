import { getToken, logout } from "./auth";

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    logout();
    window.location.href = "/login";
  }

  return res;
}
