import { describe, expect, it } from "vitest";
import { defaultExpiryDate, inferCategory } from "@/lib/cart/product-knowledge";

describe("defaultExpiryDate", () => {
  it("молочные — примерно неделя", () => {
    expect(inferCategory("молоко")).toBe("молочные");
    const exp = defaultExpiryDate("молоко");
    const days = Math.round((exp.getTime() - Date.now()) / 86400000);
    expect(days).toBeGreaterThanOrEqual(6);
    expect(days).toBeLessThanOrEqual(8);
  });
});
