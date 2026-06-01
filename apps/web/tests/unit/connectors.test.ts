import { describe, expect, it } from "vitest";
import { parseCsvOrders } from "@/connectors/csv-import";
import { demoConnector } from "@/connectors/demo";

describe("parseCsvOrders", () => {
  it("parses csv with header", () => {
    const csv = `name,qty,unit,date
Молоко,2,шт,2026-05-01
Хлеб,1,шт,2026-05-01`;
    const orders = parseCsvOrders(csv);
    expect(orders).toHaveLength(1);
    expect(orders[0].items).toHaveLength(2);
  });
});

describe("demoConnector", () => {
  it("returns demo orders", async () => {
    const since = new Date(0);
    const orders = await demoConnector.syncOrders(since);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].items.length).toBeGreaterThan(0);
  });
});
