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
  mockAuth: async ({ page }, provideFixture) => {
    await provideFixture(async () => {
      await mockAuthMe(page);
    });
  },
  mockUsers: async ({ page }, provideFixture) => {
    await provideFixture(async () => {
      await mockUsersCrud(page);
    });
  },
  mockReports: async ({ page }, provideFixture) => {
    await provideFixture(async () => {
      await mockReports(page);
    });
  },
  mockAlerts: async ({ page }, provideFixture) => {
    await provideFixture(async () => {
      await mockAlerts(page);
    });
  },
  mockDashboard: async ({ page }, provideFixture) => {
    await provideFixture(async () => {
      await mockDashboard(page);
    });
  },
  mockLogin: async ({ page }, provideFixture) => {
    await provideFixture(async () => {
      await mockLogin(page);
    });
  },
});

export { expect } from "./auth.fixture";

