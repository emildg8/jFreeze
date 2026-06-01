import { NextResponse } from "next/server";
import { parseCsvOrders } from "@/connectors";
import { parseReceiptCsv } from "@/connectors/receipt-csv";
import { parseOzonExportCsv } from "@/connectors/ozon-export";
import { persistConnectorOrders } from "@/lib/services/orders";
import { syncStore } from "@/lib/services/stores";
import type { StoreId } from "@/connectors/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const storeId = (body.storeId as StoreId) ?? "csv";
    const templateId = body.templateId as string | undefined;

    if (body.csv && typeof body.csv === "string") {
      let orders;
      if (templateId === "receipt") {
        orders = parseReceiptCsv(body.csv);
      } else if (templateId === "ozon") {
        orders = parseOzonExportCsv(body.csv);
      } else {
        orders = parseCsvOrders(body.csv);
      }
      const created = persistConnectorOrders(storeId, orders);
      return NextResponse.json({ imported: created.length });
    }

    if (storeId === "demo" || storeId === "manual") {
      const result = await syncStore(storeId, body.sinceDays ?? 90);
      return NextResponse.json(result);
    }

    if (body.items && Array.isArray(body.items)) {
      const order = {
        externalId: `manual-${Date.now()}`,
        orderedAt: body.orderedAt ? new Date(body.orderedAt) : new Date(),
        items: body.items,
      };
      const created = persistConnectorOrders("manual", [order]);
      return NextResponse.json({ imported: created.length });
    }

    const result = await syncStore(storeId, body.sinceDays ?? 90);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка импорта" },
      { status: 400 },
    );
  }
}
