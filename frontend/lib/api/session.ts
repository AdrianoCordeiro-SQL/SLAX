export const TOKEN_COOKIE = "slax-token";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function logout() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function setSessionToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function handleSessionExpired() {
  if (typeof window === "undefined") return;
  logout();
  window.location.href = "/login";
}
