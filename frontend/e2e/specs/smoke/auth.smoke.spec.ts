import { test, expect } from "../../fixtures/network.fixture";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("Auth Smoke", () => {
  test("deve redirecionar para login em rota protegida @smoke @critical @auth", async ({
    page,
  }) => {
    await page.goto(`${APP_URL}/users`);
    await expect(page).toHaveURL(/\/login\?from=%2Fusers/);
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("deve autenticar e abrir clientes @smoke @critical @auth", async ({
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
  });
});

