import { test, expect } from "../../fixtures/network.fixture";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("Alerts Smoke", () => {
  test("deve carregar área de alertas com ações principais @smoke @alerts", async ({
    page,
    setAuthCookie,
    mockAuth,
    mockAlerts,
  }) => {
    await setAuthCookie();
    await mockAuth();
    await mockAlerts();

    await page.goto(`${APP_URL}/alerts`);
    await expect(page.getByRole("heading", { name: "Alertas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Verificar agora" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova regra" })).toBeVisible();
  });
});

