import type { Page } from "@playwright/test";
import { makeAccount } from "../helpers/data-factories";
import { isApiRequest, routes } from "../helpers/routes";

export async function mockAuthMe(page: Page) {
  await page.route(routes.authMe, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, json: makeAccount() });
  });
}

export async function mockLogin(page: Page) {
  await page.route(routes.authLogin, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        access_token: "fake-token",
        token_type: "bearer",
        account: makeAccount(),
      },
    });
  });
}

