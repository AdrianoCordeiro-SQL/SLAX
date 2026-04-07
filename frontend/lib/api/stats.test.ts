/**
 * Testes do schema de stats e do fetcher fetchStats.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchStats, statsSchema } from "./stats";

const validStatsPayload = {
  total_users: 2,
  users_change: "+10.0%",
  api_requests: 100,
  requests_change: "-5.0%",
  revenue: 99.5,
  revenue_change: "+0.0%",
  returns_count: 3,
  returns_lost_value: 1200.0,
  profit: 12.34,
  monthly_avg_profit: 1.02,
};

describe("statsSchema", () => {
  it("aceita payload completo válido", () => {
    const parsed = statsSchema.parse(validStatsPayload);
    expect(parsed.revenue).toBe(99.5);
  });

  it("rejeita quando falta campo obrigatório", () => {
    const bad = { ...validStatsPayload };
    delete (bad as Record<string, unknown>).revenue;
    expect(() => statsSchema.parse(bad)).toThrow();
  });

  it("rejeita tipo incorreto", () => {
    expect(() =>
      statsSchema.parse({ ...validStatsPayload, total_users: "2" }),
    ).toThrow();
  });
});

describe("fetchStats", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(validStatsPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("devolve dados validados quando HTTP 200", async () => {
    const data = await fetchStats();
    expect(data.total_users).toBe(2);
    expect(data.api_requests).toBe(100);
  });

  it("lança quando HTTP não ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))),
    );
    await expect(fetchStats()).rejects.toThrow(/Failed to fetch stats/);
  });
});
