import { test, expect } from "@playwright/test";

test("главная → корзина smoke", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible({
    timeout: 15000,
  });

  await page.locator("nav").getByRole("link", { name: "Корзина" }).click();
  await expect(
    page.getByRole("heading", { name: "Умная корзина" }),
  ).toBeVisible();

  const refresh = page.getByRole("button", { name: "Обновить список" });
  await expect(refresh).toBeVisible({ timeout: 20000 });
  await expect(refresh).toBeEnabled();
});

test("онбординг демо-заказы", async ({ page }) => {
  await page.goto("/");
  const demoBtn = page.getByRole("button", { name: "Загрузить демо-заказы" });
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.getByRole("button", { name: "Понятно, дальше" }).click();
    await page.getByRole("button", { name: "Завершить" }).click();
  }
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "История заказов" })).toBeVisible();
});

test("API health", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
});

test("страница платформ", async ({ page }) => {
  await page.goto("/platforms");
  await expect(page.getByText("Веб и PWA")).toBeVisible();
  await expect(page.getByText("Telegram-бот")).toBeVisible();
});

test("настройки — сервер и навигация", async ({ page }) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Сервер jFreeze" }),
  ).toBeVisible();
});
