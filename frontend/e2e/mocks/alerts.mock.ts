import type { Page } from "@playwright/test";
import { isApiRequest, routes } from "../helpers/routes";

export async function mockAlerts(page: Page) {
  const rules = [
    {
      id: 1,
      account_id: 1,
      rule_type: "returns_rate_above",
      params: { window_days: 7, max_percent: 10, min_events: 5 },
      enabled: true,
      cooldown_hours: 24,
      created_at: "2026-01-01T10:00:00Z",
      updated_at: "2026-01-01T10:00:00Z",
    },
  ];

  await page.route(routes.alertRules, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, json: rules });
      return;
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as {
        rule_type: "returns_rate_above" | "revenue_drop" | "days_without_purchase";
        params: Record<string, unknown>;
        enabled: boolean;
        cooldown_hours: number;
      };
      const created = {
        id: rules.length + 1,
        account_id: 1,
        rule_type: body.rule_type,
        params: body.params,
        enabled: body.enabled,
        cooldown_hours: body.cooldown_hours,
        created_at: "2026-01-02T10:00:00Z",
        updated_at: "2026-01-02T10:00:00Z",
      };
      rules.push(created);
      await route.fulfill({ status: 200, json: created });
      return;
    }
    await route.fallback();
  });

  await page.route(routes.alertFirings, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: { items: [], total: 0, page: 1, per_page: 20, pages: 1 },
    });
  });

  await page.route(routes.alertEvaluate, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: { fired: [{ rule_id: 1, firing_id: 10, message: "Alerta disparado" }] },
    });
  });
}

