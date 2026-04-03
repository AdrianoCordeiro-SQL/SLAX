/**
 * Testes do helper cn (clsx + tailwind-merge).
 */
import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("concatena classes e resolve conflitos do Tailwind", () => {
    expect(cn("px-2 py-1", "px-4")).toContain("px-4");
    expect(cn("px-2 py-1", "px-4")).not.toMatch(/px-2/);
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
