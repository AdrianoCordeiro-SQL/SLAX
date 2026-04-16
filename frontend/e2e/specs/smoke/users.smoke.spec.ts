import { test, expect } from "../../fixtures/network.fixture";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("Users Smoke", () => {
  test("deve carregar gestão de clientes e exibir ação principal @smoke @critical @users", async ({
    page,
    setAuthCookie,
    mockAuth,
    mockUsers,
  }) => {
    await setAuthCookie();
    await mockAuth();
    await mockUsers();

    await page.goto(`${APP_URL}/users`);
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Cliente" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Adicionar cliente" })).toBeVisible();
  });
});

