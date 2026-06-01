import { describe, expect, it } from "vitest";
import {
  normalizeProductName,
  normalizeOrderItems,
} from "@/lib/orders/normalize";

describe("normalizeProductName", () => {
  it("lowercases and trims", () => {
    expect(normalizeProductName("  Молоко 2.5% 1л  ")).toContain("молоко");
  });
});

describe("normalizeOrderItems", () => {
  it("normalizes qty defaults", () => {
    const items = normalizeOrderItems([{ name: "Яйца" }]);
    expect(items[0].qty).toBe(1);
    expect(items[0].unit).toBe("шт");
  });
});
