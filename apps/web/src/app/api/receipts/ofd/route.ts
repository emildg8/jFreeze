import { NextResponse } from "next/server";
import { resolveOfdReceipt } from "@/lib/receipt/ofd-qr";
import { persistConnectorOrders } from "@/lib/services/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const qr = typeof body.qr === "string" ? body.qr.trim() : "";
    if (!qr) {
      return NextResponse.json({ error: "Передайте строку QR или ссылку чека" }, { status: 400 });
    }

    const result = await resolveOfdReceipt(qr);
    const flat = result.orders[0];

    if (body.autoImport === true) {
      const created = await persistConnectorOrders("receipt", result.orders);
      return NextResponse.json({
        imported: created.length,
        autoImport: true,
        source: result.source,
        verifyUrl: result.verifyUrl,
      });
    }

    return NextResponse.json({
      kind: "ofd-qr",
      source: result.source,
      verifyUrl: result.verifyUrl,
      orderedAt: flat.orderedAt.toISOString(),
      totalRub: flat.totalRub,
      items: flat.items,
      ofd: {
        fn: result.ofd.fn,
        fd: result.ofd.fd,
        fp: result.ofd.fp,
        totalRub: result.ofd.totalRub,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка разбора QR" },
      { status: 400 },
    );
  }
}
