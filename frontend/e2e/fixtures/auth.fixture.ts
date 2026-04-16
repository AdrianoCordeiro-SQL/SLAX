import { test as base } from "@playwright/test";

type AuthFixture = {
  setAuthCookie: () => Promise<void>;
};

export const test = base.extend<AuthFixture>({
  setAuthCookie: async ({ page }, use) => {
    const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
    const setAuthCookie = async () => {
      await page.context().addCookies([
        {
          name: "slax-token",
          value: "fake-token",
          url: appUrl,
        },
      ]);
    };

    await use(setAuthCookie);
  },
});

export { expect } from "@playwright/test";

