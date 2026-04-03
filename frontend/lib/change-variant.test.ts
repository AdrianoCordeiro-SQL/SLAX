/**
 * Testes de classes Tailwind e cores para variação percentual.
 */
import { describe, expect, it } from "vitest";

import { getChangeBadgeClasses, getChangeSparklineColor } from "./change-variant";

describe("getChangeBadgeClasses", () => {
  it("positivo usa fundo verde", () => {
    expect(getChangeBadgeClasses("+10.0%")).toContain("green");
  });

  it("negativo usa fundo vermelho", () => {
    expect(getChangeBadgeClasses("-5.0%")).toContain("red");
  });

  it("neutro usa cinza", () => {
    expect(getChangeBadgeClasses("0%")).toContain("gray");
  });
});

describe("getChangeSparklineColor", () => {
  it("devolve verde, vermelho ou cinza conforme o sinal", () => {
    expect(getChangeSparklineColor("+1%")).toBe("#16a34a");
    expect(getChangeSparklineColor("-1%")).toBe("#dc2626");
    expect(getChangeSparklineColor("0%")).toBe("#6b7280");
  });
});
