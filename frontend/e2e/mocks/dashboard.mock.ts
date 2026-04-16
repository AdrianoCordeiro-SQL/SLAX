import type { Page } from "@playwright/test";
import { makeSparklines, makeStats } from "../helpers/data-factories";
import { isApiRequest, routes } from "../helpers/routes";

export async function mockDashboard(page: Page) {
  await page.route(routes.stats, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, json: makeStats() });
  });

  await page.route(routes.sparklines, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, json: makeSparklines() });
  });

  await page.route(routes.activity, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        items: [
          {
            id: 1,
            user: "Cliente Inicial",
            avatar_url: null,
            action: "Comprou item",
            timestamp: "2026-01-01T10:00:00Z",
            status: "Success",
          },
        ],
        total: 1,
        page: 1,
        per_page: 20,
        pages: 1,
      },
    });
  });
}

