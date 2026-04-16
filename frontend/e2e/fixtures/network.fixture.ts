import { test as base } from "./auth.fixture";
import { mockAuthMe, mockLogin } from "../mocks/auth.mock";
import { mockUsersCrud } from "../mocks/users.mock";
import { mockReports } from "../mocks/reports.mock";
import { mockAlerts } from "../mocks/alerts.mock";
import { mockDashboard } from "../mocks/dashboard.mock";

type NetworkFixture = {
  mockAuth: () => Promise<void>;
  mockUsers: () => Promise<void>;
  mockReports: () => Promise<void>;
  mockAlerts: () => Promise<void>;
  mockDashboard: () => Promise<void>;
  mockLogin: () => Promise<void>;
};

export const test = base.extend<NetworkFixture>({
  mockAuth: async ({ page }, use) => {
    await use(async () => {
      await mockAuthMe(page);
    });
  },
  mockUsers: async ({ page }, use) => {
    await use(async () => {
      await mockUsersCrud(page);
    });
  },
  mockReports: async ({ page }, use) => {
    await use(async () => {
      await mockReports(page);
    });
  },
  mockAlerts: async ({ page }, use) => {
    await use(async () => {
      await mockAlerts(page);
    });
  },
  mockDashboard: async ({ page }, use) => {
    await use(async () => {
      await mockDashboard(page);
    });
  },
  mockLogin: async ({ page }, use) => {
    await use(async () => {
      await mockLogin(page);
    });
  },
});

export { expect } from "./auth.fixture";

