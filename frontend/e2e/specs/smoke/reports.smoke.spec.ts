import { test, expect } from "../../fixtures/network.fixture";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("Reports Smoke", () => {
  test("deve atualizar dados ao trocar período @smoke @reports", async ({
    page,
    setAuthCookie,
    mockAuth,
    mockReports,
  }) => {
    await setAuthCookie();
    await mockAuth();
    await mockReports();

    await page.goto(`${APP_URL}/reports`);
    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.nth(0)).toBeVisible();
    await dateInputs.nth(0).fill("2026-02-01");
    await dateInputs.nth(1).fill("2026-02-20");
    await expect(dateInputs.nth(0)).toHaveValue("2026-02-01");
    await expect(dateInputs.nth(1)).toHaveValue("2026-02-20");
  });
});

