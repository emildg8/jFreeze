import { test, expect } from "@playwright/test";

test("главная → корзина smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible();

  await page.locator("nav").getByRole("link", { name: "Корзина" }).click();
  await expect(
    page.getByRole("heading", { name: "Умная корзина" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Обновить список" }),
  ).toBeEnabled({ timeout: 15000 });
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
