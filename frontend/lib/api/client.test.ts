/**
 * Testes de apiFetch: Authorization e sessão expirada (401).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./client";
import * as session from "./session";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.spyOn(session, "getToken").mockReturnValue("fake-jwt");
    vi.spyOn(session, "handleSessionExpired").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("envia Authorization quando existe token", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("https://api.example/stats");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example/stats",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const call = fetchMock.mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer fake-jwt");
  });

  it("chama handleSessionExpired em 401 no browser", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    await apiFetch("https://api.example/protected");

    expect(session.handleSessionExpired).toHaveBeenCalled();
  });
});
