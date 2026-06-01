import { describe, expect, it } from "vitest";
import { parseReceiptText } from "@/lib/receipt/text-parser";
import { extractTextFromEml } from "@/lib/receipt/eml-parser";

describe("parseReceiptText", () => {
  it("parses typical receipt lines", () => {
    const text = `
ООО МАГНИТ
01.06.2026
МОЛОКО 2.5% 1Л 2 x 89.90
ХЛЕБ БЕЛЫЙ 1 x 45.00
ИТОГО 224.80
`;
    const orders = parseReceiptText(text);
    expect(orders[0].items.length).toBeGreaterThanOrEqual(2);
    expect(orders[0].totalRub).toBeCloseTo(224.8, 0);
  });

  it("parses price at end of line", () => {
    const orders = parseReceiptText("СЫР РОССИЙСКИЙ 199.00");
    expect(orders[0].items[0].name).toMatch(/СЫР/i);
  });
});

describe("extractTextFromEml", () => {
  it("extracts plain text part", () => {
    const eml = `From: shop@test.ru
Content-Type: text/plain; charset=utf-8

МОЛОКО 1 x 80.00
ИТОГО 80.00`;
    const text = extractTextFromEml(eml);
    expect(text).toContain("МОЛОКО");
  });
});
