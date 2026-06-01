import { describe, expect, it } from "vitest";
import { detectFromEmail, detectFromSms } from "@/lib/sources/detect";
import { importFromEmail, importFromSms } from "@/lib/sources/import";

describe("detectFromEmail", () => {
  it("detects Ozon", () => {
    const entry = detectFromEmail({
      from: "noreply@ozon.ru",
      subject: "Ваш заказ доставлен",
      body: "Спасибо за покупку",
    });
    expect(entry?.id).toBe("ozon");
  });

  it("detects OFD receipt", () => {
    const entry = detectFromEmail({
      from: "receipt@ofd.ru",
      subject: "Кассовый чек",
      body: "Фискальный документ",
    });
    expect(entry?.id).toBe("ofd");
  });
});

describe("detectFromSms", () => {
  it("detects bank purchase SMS", () => {
    const entry = detectFromSms(
      "MIR-1234 01.06.26 12:00 Покупка 500.00р PYATEROCHKA Баланс: 10000р",
    );
    expect(entry?.storeId).toBeDefined();
  });

  it("detects Samokat SMS", () => {
    const entry = detectFromSms("Самокат: заказ доставлен, списано 1200р");
    expect(entry?.id).toBe("samokat");
  });
});

describe("importFromSms", () => {
  it("creates order from bank SMS", () => {
    const results = importFromSms(
      "MIR-1234 01.06.26 Покупка 1234.56р MAGNIT Баланс: 5000р",
    );
    expect(results[0].orders.length).toBe(1);
    expect(results[0].orders[0].totalRub).toBeCloseTo(1234.56, 0);
  });
});

describe("importFromEmail", () => {
  it("parses receipt lines in email body", () => {
    const result = importFromEmail({
      raw: `
From: shop@test.ru
Subject: Чек

МОЛОКО 2.5% 2 x 89.90
ХЛЕБ 1 x 45.00
ИТОГО 224.80
`,
    });
    expect(result.orders[0]?.items.length).toBeGreaterThanOrEqual(2);
  });
});
