import { describe, expect, it } from "vitest";
import {
  allocateOrderSpendByCategory,
  buildWeeklySpendSummary,
} from "@/lib/orders/spend-summary";

describe("spend-summary", () => {
  it("распределяет сумму заказа по категориям", () => {
    const map = allocateOrderSpendByCategory({
      orderedAt: new Date(),
      totalRub: 1000,
      items: [
        { name: "Молоко", normalizedName: "молоко", qty: 2 },
        { name: "Хлеб", normalizedName: "хлеб", qty: 1 },
      ],
    });
    expect(map.get("молочные")?.totalRub).toBeCloseTo(666.67, 0);
    expect(map.get("выпечка")?.totalRub).toBeCloseTo(333.33, 0);
  });

  it("считает недельную сводку с byCategory", () => {
    const now = new Date();
    const summary = buildWeeklySpendSummary([
      {
        storeId: "demo",
        orderedAt: now,
        totalRub: 500,
        items: [{ name: "Сыр", normalizedName: "сыр", qty: 1 }],
      },
    ]);
    expect(summary.orderCount).toBe(1);
    expect(summary.totalRub).toBe(500);
    expect(summary.byCategory[0]?.category).toBe("молочные");
  });
});
