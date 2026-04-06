/**
 * Testes de intervalo de datas padrão para relatórios (UTC).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDefaultReportDateRange, toISODate } from "./date-range";

describe("toISODate", () => {
  it("devolve apenas a parte YYYY-MM-DD em UTC", () => {
    expect(toISODate(new Date("2024-03-05T15:30:00.000Z"))).toBe("2024-03-05");
  });
});

const DAY_MS = 86_400_000;

describe("getDefaultReportDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa hoje como fim e 365 dias antes como início (datas ISO, UTC)", () => {
    const now = new Date("2024-06-15T12:00:00.000Z");
    const { start, end } = getDefaultReportDateRange();
    expect(end).toBe(toISODate(now));
    expect(start).toBe(toISODate(new Date(now.getTime() - 365 * DAY_MS)));
  });
});
