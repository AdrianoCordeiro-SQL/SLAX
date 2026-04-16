import { test, expect } from "../../fixtures/network.fixture";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("Dashboard Smoke", () => {
  test("deve carregar visão geral com cards principais @smoke @dashboard", async ({
    page,
    setAuthCookie,
    mockAuth,
    mockDashboard,
  }) => {
    await setAuthCookie();
    await mockAuth();
    await mockDashboard();

    await page.goto(`${APP_URL}/`);
    await expect(page.getByRole("heading", { name: /Visão geral/ })).toBeVisible();
    await expect(page.getByText("Atividade recente da plataforma")).toBeVisible();
  });
});

