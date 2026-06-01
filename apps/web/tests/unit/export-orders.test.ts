import { describe, expect, it } from "vitest";
import {
  flattenOrdersForExport,
  ordersToCsv,
  ordersToExcelXml,
} from "@/lib/export/orders";

describe("flattenOrdersForExport", () => {
  it("expands order items to rows", () => {
    const rows = flattenOrdersForExport([
      {
        id: "o1",
        storeId: "demo",
        profileId: "default",
        orderedAt: new Date("2026-06-01"),
        externalId: "ext-1",
        totalRub: 100,
        createdAt: new Date(),
        items: [
          {
            id: "i1",
            orderId: "o1",
            name: "Молоко",
            normalizedName: "молоко",
            qty: 2,
            unit: "шт",
            category: null,
          },
        ],
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].itemName).toBe("Молоко");
    expect(rows[0].storeName).toContain("Демо");
  });
});

describe("ordersToCsv", () => {
  it("uses semicolon and escapes quotes", () => {
    const csv = ordersToCsv([
      {
        orderId: "1",
        externalId: "",
        orderedAt: "2026-06-01",
        storeId: "demo",
        storeName: "Демо",
        orderTotalRub: "50",
        itemName: 'Сыр "Российский"',
        normalizedName: "сыр",
        qty: 1,
        unit: "шт",
        category: "",
      },
    ]);
    expect(csv).toContain(";");
    expect(csv).toContain('""Российский""');
  });
});

describe("ordersToExcelXml", () => {
  it("produces valid spreadsheet xml", () => {
    const xml = ordersToExcelXml([
      {
        orderId: "1",
        externalId: "",
        orderedAt: "2026-06-01",
        storeId: "ozon",
        storeName: "Озон",
        orderTotalRub: "100",
        itemName: "Хлеб",
        normalizedName: "хлеб",
        qty: 1,
        unit: "шт",
        category: "",
      },
    ]);
    expect(xml).toContain("<?xml");
    expect(xml).toContain("Worksheet");
    expect(xml).toContain("Хлеб");
  });
});
