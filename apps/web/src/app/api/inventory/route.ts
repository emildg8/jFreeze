import { NextResponse } from "next/server";
import {
  listInventory,
  upsertInventoryItem,
  deleteInventoryItem,
} from "@/lib/services/inventory";

export async function GET() {
  try {
    return NextResponse.json({ items: listInventory() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = upsertInventoryItem({
      name: body.name,
      qty: body.qty ?? 1,
      unit: body.unit,
      zone: body.zone,
      expiryAt: body.expiryAt ? new Date(body.expiryAt) : undefined,
      source: body.source,
      barcode: body.barcode,
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    }
    deleteInventoryItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Ошибка удаления";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
