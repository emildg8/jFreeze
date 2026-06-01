import { describe, expect, it } from "vitest";
import {
  suggestSmartCart,
  estimateCartTotal,
  type OrderPriceHistory,
} from "@/lib/cart/smart-engine";
import {
  DEFAULT_CART_PREFERENCES,
  type CartPreferences,
} from "@/lib/cart/preferences";
import type { OrderHistoryItem, InventorySnapshot } from "@/lib/cart/engine";

const engine = { minQtyThreshold: 1, historyDays: 90 };

const orders: OrderHistoryItem[] = [
  {
    normalizedName: "молоко",
    name: "Молоко",
    qty: 2,
    unit: "шт",
    orderedAt: new Date(),
  },
  {
    normalizedName: "хлеб",
    name: "Хлеб",
    qty: 1,
    unit: "шт",
    orderedAt: new Date(),
  },
  {
    normalizedName: "гречка",
    name: "Гречка",
    qty: 1,
    unit: "кг",
    orderedAt: new Date(),
  },
];

const emptyInventory: InventorySnapshot[] = [];

describe("suggestSmartCart", () => {
  it("excludes bakery and grocery when excludeBakery is true", () => {
    const prefs: CartPreferences = {
      ...DEFAULT_CART_PREFERENCES,
      excludeBakery: true,
    };
    const items = suggestSmartCart(orders, emptyInventory, engine, prefs);
    const names = items.map((i) => i.normalizedName);
    expect(names).not.toContain("хлеб");
    expect(names).not.toContain("гречка");
    expect(names).toContain("молоко");
  });

  it("respects budget cap", () => {
    const prefs: CartPreferences = {
      ...DEFAULT_CART_PREFERENCES,
      excludeBakery: false,
      budgetRub: 100,
      maxItems: 10,
    };
    const priceHistory: OrderPriceHistory[] = [
      { normalizedName: "молоко", avgPriceRub: 90 },
      { normalizedName: "хлеб", avgPriceRub: 50 },
    ];
    const items = suggestSmartCart(
      orders,
      emptyInventory,
      engine,
      prefs,
      priceHistory,
    );
    const total = estimateCartTotal(items);
    expect(total).toBeLessThanOrEqual(100);
    expect(items.length).toBeGreaterThan(0);
  });

  it("limits max items", () => {
    const prefs: CartPreferences = {
      ...DEFAULT_CART_PREFERENCES,
      maxItems: 1,
      excludeBakery: false,
    };
    const items = suggestSmartCart(orders, emptyInventory, engine, prefs);
    expect(items.length).toBeLessThanOrEqual(1);
  });
});
