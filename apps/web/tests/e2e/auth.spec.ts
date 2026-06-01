import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("/account без сессии → login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Вход в jFreeze" })).toBeVisible();
});

test("страница входа — OTP в dev-режиме", async ({ page }) => {
  const digits = `900${String(Date.now() % 10_000_000).padStart(7, "0")}`;

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Вход в jFreeze" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Получить код" })).toBeVisible({
    timeout: 10000,
  });

  const main = page.getByRole("main");
  await main.getByRole("textbox", { name: "Телефон" }).pressSequentially(digits);
  await main.getByRole("button", { name: "Получить код" }).click();

  await expect(main.locator("strong.tabular-nums")).toBeVisible({ timeout: 10000 });
  await expect(main.getByRole("textbox", { name: "Код" })).toBeVisible();
});

test("вход по телефону → кабинет", async ({ page }) => {
  const digits = `900${String(Date.now() % 10_000_000).padStart(7, "0")}`;
  const phone = `+7${digits}`;

  const sendRes = await page.request.post("/api/auth/phone/send", { data: { phone } });
  expect(sendRes.ok(), await sendRes.text()).toBeTruthy();
  const { devCode } = await sendRes.json();
  expect(devCode).toMatch(/^\d{6}$/);

  const csrfRes = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  const signInRes = await page.request.post("/api/auth/callback/phone", {
    form: {
      csrfToken,
      phone,
      code: devCode,
      callbackUrl: "/account",
    },
  });
  expect(signInRes.ok()).toBeTruthy();

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Личный кабинет" })).toBeVisible();
});
