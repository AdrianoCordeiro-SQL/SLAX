import type { Page } from "@playwright/test";
import { isApiRequest, routes } from "../helpers/routes";

export async function mockReports(page: Page) {
  await page.route(routes.reports, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    const requestUrl = new URL(route.request().url());
    const start = requestUrl.searchParams.get("start") ?? "";

    if (requestUrl.pathname.endsWith("/summary")) {
      const payload =
        start < "2026-01-15"
          ? {
              total_requests: 10,
              requests_change: "+5%",
              success_rate: 98,
              success_rate_change: "+1%",
              total_revenue: 1000,
              revenue_change: "+2%",
              active_users: 3,
              active_users_change: "+1",
              returns_count: 1,
              returns_lost_value: 50,
              profit: 950,
              monthly_avg_profit: 900,
            }
          : {
              total_requests: 20,
              requests_change: "+10%",
              success_rate: 99,
              success_rate_change: "+2%",
              total_revenue: 2000,
              revenue_change: "+4%",
              active_users: 5,
              active_users_change: "+2",
              returns_count: 2,
              returns_lost_value: 100,
              profit: 1900,
              monthly_avg_profit: 1800,
            };
      await route.fulfill({ status: 200, json: payload });
      return;
    }

    if (requestUrl.pathname.endsWith("/status-breakdown")) {
      await route.fulfill({ status: 200, json: [{ status: "success", count: 1 }] });
      return;
    }
    if (requestUrl.pathname.endsWith("/top-actions")) {
      await route.fulfill({ status: 200, json: [{ action: "Comprou item", count: 1 }] });
      return;
    }
    if (requestUrl.pathname.endsWith("/top-users")) {
      await route.fulfill({
        status: 200,
        json: [{ user_id: 1, name: "Cliente Inicial", avatar_url: null, count: 1 }],
      });
      return;
    }
    if (requestUrl.pathname.endsWith("/revenue-trend")) {
      await route.fulfill({ status: 200, json: [{ date: "2026-01-01", value: 1000 }] });
      return;
    }
    if (requestUrl.pathname.endsWith("/logs")) {
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
      return;
    }

    await route.fallback();
  });
}

