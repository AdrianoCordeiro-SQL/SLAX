/**
 * Testes de constantes de estado de log e estilos associados.
 */
import { describe, expect, it } from "vitest";

import {
  FALLBACK_CHART_COLOR,
  FALLBACK_STATUS_BADGE,
  LOG_STATUSES,
  STATUS_BADGE_STYLES,
  STATUS_CHART_COLORS,
  type LogStatus,
} from "./status";

describe("LOG_STATUSES", () => {
  it("lista os estados esperados", () => {
    expect(LOG_STATUSES).toHaveLength(4);
    expect(LOG_STATUSES).toContain("Success");
    expect(LOG_STATUSES).toContain("Pending");
    expect(LOG_STATUSES).toContain("Failed");
    expect(LOG_STATUSES).toContain("Error");
  });
});

describe("STATUS_BADGE_STYLES e STATUS_CHART_COLORS", () => {
  it("definem entrada para cada LogStatus", () => {
    LOG_STATUSES.forEach((s: LogStatus) => {
      expect(STATUS_BADGE_STYLES[s]).toBeTruthy();
      expect(STATUS_CHART_COLORS[s]).toMatch(/^#/);
    });
  });

  it("fallbacks estão definidos", () => {
    expect(FALLBACK_STATUS_BADGE).toContain("gray");
    expect(FALLBACK_CHART_COLOR).toMatch(/^#/);
  });
});
