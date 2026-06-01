import { describe, expect, it, vi } from "vitest";
import { lookupBarcodeProduct } from "@/lib/barcode/lookup";

describe("lookupBarcodeProduct", () => {
  it("returns null for short code", async () => {
    const result = await lookupBarcodeProduct("123");
    expect(result).toBeNull();
  });

  it("parses Open Food Facts response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: "Молоко 2.5%",
            brands: "Домик в деревне",
            quantity: "1 L",
          },
        }),
      }),
    );

    const result = await lookupBarcodeProduct("4601234567890");
    expect(result?.name).toBe("Молоко 2.5%");
    expect(result?.brand).toBe("Домик в деревне");

    vi.unstubAllGlobals();
  });
});
