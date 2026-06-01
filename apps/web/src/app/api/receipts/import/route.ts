import { NextResponse } from "next/server";
import { parseReceiptInput } from "@/lib/receipt/import-receipt";
import { persistConnectorOrders } from "@/lib/services/orders";
import type { ConnectorOrderItem } from "@/connectors/types";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let orders;
    let kind: string;
    let preview: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      const pasted = form.get("text") as string | null;
      const autoImport = form.get("autoImport") === "true";

      if (pasted?.trim()) {
        const result = await parseReceiptInput({ text: pasted });
        orders = result.orders;
        kind = result.kind;
        preview = result.preview;
      } else if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await parseReceiptInput({
          buffer,
          filename: file.name,
          mimeType: file.type,
        });
        orders = result.orders;
        kind = result.kind;
        preview = result.preview;

        if (autoImport && orders.length > 0) {
          const created = await persistConnectorOrders("receipt", orders);
          return NextResponse.json({
            imported: created.length,
            kind,
            autoImport: true,
          });
        }
      } else {
        return NextResponse.json(
          { error: "Передайте файл или текст чека" },
          { status: 400 },
        );
      }
    } else {
      const body = await request.json();
      if (body.text && typeof body.text === "string") {
        const result = await parseReceiptInput({ text: body.text });
        orders = result.orders;
        kind = result.kind;
        preview = result.preview;
      } else if (body.confirm && body.items) {
        const orderedAt = body.orderedAt
          ? new Date(body.orderedAt)
          : new Date();
        const items = body.items as ConnectorOrderItem[];
        const created = await persistConnectorOrders("receipt", [
          {
            externalId: `receipt-${Date.now()}`,
            orderedAt,
            totalRub: body.totalRub,
            items,
          },
        ]);
        return NextResponse.json({ imported: created.length });
      } else {
        return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
      }
    }

    const flat = orders[0];
    return NextResponse.json({
      kind,
      preview,
      orderedAt: flat?.orderedAt?.toISOString(),
      totalRub: flat?.totalRub,
      items: flat?.items ?? [],
      orderCount: orders.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка разбора чека" },
      { status: 400 },
    );
  }
}
