import { describe, expect, it } from "vitest";
import { parseReceiptCsv } from "@/connectors/receipt-csv";
import { parseOzonExportCsv } from "@/connectors/ozon-export";
import { parseCsvOrders } from "@/connectors/csv-import";
import { normalizeProductName } from "@/lib/orders/normalize";

describe("parseReceiptCsv", () => {
  it("parses receipt format", () => {
    const csv = `товар,количество,дата
МОЛОКО 1Л,2,2026-06-01`;
    const orders = parseReceiptCsv(csv);
    expect(orders[0].items).toHaveLength(1);
  });
});

describe("parseOzonExportCsv", () => {
  it("parses ozon export", () => {
    const csv = `product_name,quantity,order_date
Сыр,1,2026-06-01`;
    const orders = parseOzonExportCsv(csv);
    expect(orders[0].items[0].name).toBe("Сыр");
  });
});

describe("parseCsvOrders pyaterochka", () => {
  it("parses Наименование column", () => {
    const csv = `Наименование,Кол-во,Дата
Яйца,1,2026-06-01`;
    const orders = parseCsvOrders(csv);
    expect(orders[0].items[0].name).toBe("Яйца");
  });
});

describe("normalizeProductName synonyms", () => {
  it("maps milk variants", () => {
    expect(normalizeProductName("Молоко 2.5% 1л")).toBe("молоко");
  });
});
