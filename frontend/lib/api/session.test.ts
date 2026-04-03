/**
 * Testes de cookie de sessão (token) em ambiente jsdom.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getToken, logout, setSessionToken } from "./session";

describe("getToken", () => {
  beforeEach(() => {
    document.cookie = "";
  });

  afterEach(() => {
    document.cookie = "";
  });

  it("devolve null sem cookie", () => {
    expect(getToken()).toBeNull();
  });

  it("devolve o token após setSessionToken", () => {
    setSessionToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("logout remove o token", () => {
    setSessionToken("x");
    logout();
    expect(getToken()).toBeNull();
  });

  it("lê o token quando existem outros cookies", () => {
    document.cookie = "other=1; path=/";
    setSessionToken("mytok");
    expect(getToken()).toBe("mytok");
  });
});
