import type { Page } from "@playwright/test";
import { makeUser } from "../helpers/data-factories";
import { isApiRequest, routes } from "../helpers/routes";

export async function mockUsersCrud(page: Page) {
  const users = [makeUser(1, "Cliente Inicial")];

  await page.route(routes.users, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, json: users });
      return;
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as { first_name: string };
      const created = makeUser(users.length + 1, body.first_name);
      users.push(created);
      await route.fulfill({ status: 200, json: created });
      return;
    }
    await route.fallback();
  });

  await page.route(routes.usersById, async (route) => {
    if (!isApiRequest(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    if (route.request().method() !== "DELETE") {
      await route.fallback();
      return;
    }
    const id = Number(new URL(route.request().url()).pathname.split("/").pop());
    const index = users.findIndex((item) => item.id === id);
    if (index >= 0) users.splice(index, 1);
    await route.fulfill({ status: 204, body: "" });
  });
}

