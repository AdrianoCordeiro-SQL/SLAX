/**
 * Testes do hook useStats com fetch mockado e QueryClient.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStats } from "./useStats";
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/query-client";

const statsJson = {
  total_users: 1,
  users_change: "0%",
  api_requests: 0,
  requests_change: "0%",
  db_health: "Healthy",
  db_health_change: "Stable",
  revenue: 0,
  revenue_change: "0%",
};

describe("useStats", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(statsJson), {
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

  it("carrega stats após sucesso da API", async () => {
    const qc = createTestQueryClient();
    const wrapper = createQueryWrapper(qc);

    const { result } = renderHook(() => useStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.total_users).toBe(1);
    expect(result.current.data?.revenue).toBe(0);
  });
});
