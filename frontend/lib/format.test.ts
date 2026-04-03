/**
 * Testes de helpers de formatação (iniciais e data curta).
 */
import { describe, expect, it } from "vitest";

import { formatShortDate, getInitials } from "./format";

describe("getInitials", () => {
  it("devolve até duas letras em maiúsculas a partir do nome", () => {
    expect(getInitials("Maria Silva")).toBe("MS");
    expect(getInitials("João")).toBe("J");
  });

  it("com string vazia devolve string vazia", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("formatShortDate", () => {
  it("formata ISO em locale en-US", () => {
    const s = formatShortDate("2024-06-15T12:00:00.000Z");
    expect(s).toMatch(/2024/);
    expect(s.length).toBeGreaterThan(4);
  });
});
