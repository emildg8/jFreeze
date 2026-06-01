import { describe, expect, it } from "vitest";
import {
  suggestCart,
  mergeInventoryByZone,
  type OrderHistoryItem,
  type InventorySnapshot,
} from "@/lib/cart/engine";

describe("suggestCart", () => {
  const orders: OrderHistoryItem[] = [
    {
      normalizedName: "молоко",
      name: "Молоко",
      qty: 2,
      unit: "шт",
      orderedAt: new Date(),
    },
    {
      normalizedName: "молоко",
      name: "Молоко",
      qty: 1,
      unit: "шт",
      orderedAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      normalizedName: "хлеб",
      name: "Хлеб",
      qty: 1,
      unit: "шт",
      orderedAt: new Date(),
    },
  ];

  it("suggests items not in inventory", () => {
    const inventory: InventorySnapshot[] = [
      {
        normalizedName: "молоко",
        name: "Молоко",
        qty: 2,
        unit: "шт",
        zone: "fridge",
      },
    ];
    const result = suggestCart(orders, inventory, {
      minQtyThreshold: 2,
      historyDays: 90,
    });
    const bread = result.find((r) => r.normalizedName === "хлеб");
    expect(bread).toBeDefined();
    expect(bread?.suggestedQty).toBeGreaterThan(0);
  });

  it("skips items above threshold", () => {
    const inventory: InventorySnapshot[] = [
      {
        normalizedName: "молоко",
        name: "Молоко",
        qty: 5,
        unit: "шт",
        zone: "fridge",
      },
      {
        normalizedName: "хлеб",
        name: "Хлеб",
        qty: 3,
        unit: "шт",
        zone: "fridge",
      },
    ];
    const result = suggestCart(orders, inventory, {
      minQtyThreshold: 2,
      historyDays: 90,
    });
    expect(result.length).toBe(0);
  });
});

describe("mergeInventoryByZone", () => {
  it("filters freezer zone only", () => {
    const items: InventorySnapshot[] = [
      {
        normalizedName: "мороженое",
        name: "Мороженое",
        qty: 1,
        unit: "шт",
        zone: "freezer",
      },
      {
        normalizedName: "молоко",
        name: "Молоко",
        qty: 1,
        unit: "л",
        zone: "fridge",
      },
    ];
    const merged = mergeInventoryByZone(items, "freezer");
    expect(merged).toHaveLength(1);
    expect(merged[0].normalizedName).toBe("мороженое");
  });
});
