/**
 * Testes do middleware Next.js: rotas públicas, redirect sem token, passagem com cookie.
 */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

describe("middleware", () => {
  it("permite /login sem cookie", () => {
    const req = new NextRequest(new URL("http://localhost:3000/login"));
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("permite /register sem cookie", () => {
    const req = new NextRequest(new URL("http://localhost:3000/register"));
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("redireciona para /login com from quando não há token", () => {
    const req = new NextRequest(new URL("http://localhost:3000/dashboard"));
    const res = middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get("location");
    expect(loc).toBeTruthy();
    expect(loc).toContain("/login");
    expect(loc).toContain("from=");
  });

  it("permite rota protegida com cookie slax-token", () => {
    const req = new NextRequest(new URL("http://localhost:3000/dashboard"), {
      headers: { cookie: "slax-token=fake-jwt-token" },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
