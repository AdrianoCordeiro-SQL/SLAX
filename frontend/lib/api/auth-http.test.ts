/**
 * Testes dos schemas Zod exportados por auth-http (conta, login, atualização, senha).
 */
import { describe, expect, it } from "vitest";

import {
  accountSchema,
  accountUpdateSchema,
  loginResponseSchema,
  passwordChangeSchema,
} from "./auth-http";

const validAccount = {
  id: 1,
  email: "a@b.com",
  name: "Nome",
  avatar_url: null as string | null,
};

describe("accountSchema", () => {
  it("aceita avatar_url null ou string", () => {
    expect(accountSchema.parse(validAccount).id).toBe(1);
    expect(
      accountSchema.parse({ ...validAccount, avatar_url: "https://x" }).avatar_url,
    ).toBe("https://x");
  });

  it("rejeita id não numérico", () => {
    expect(() => accountSchema.parse({ ...validAccount, id: "1" })).toThrow();
  });
});

describe("accountUpdateSchema", () => {
  it("exige nome com pelo menos 2 caracteres", () => {
    expect(() => accountUpdateSchema.parse({ name: "A" })).toThrow();
    expect(accountUpdateSchema.parse({ name: "Ab" }).name).toBe("Ab");
  });
});

describe("passwordChangeSchema", () => {
  it("rejeita quando nova senha e confirmação diferem", () => {
    const r = passwordChangeSchema.safeParse({
      current_password: "old",
      new_password: "123456",
      confirm_password: "654321",
    });
    expect(r.success).toBe(false);
  });

  it("aceita quando coincidem", () => {
    const r = passwordChangeSchema.safeParse({
      current_password: "old",
      new_password: "123456",
      confirm_password: "123456",
    });
    expect(r.success).toBe(true);
  });
});

describe("loginResponseSchema", () => {
  it("aceita resposta típica de login", () => {
    const data = loginResponseSchema.parse({
      access_token: "tok",
      token_type: "bearer",
      account: validAccount,
    });
    expect(data.account.email).toBe("a@b.com");
  });
});
