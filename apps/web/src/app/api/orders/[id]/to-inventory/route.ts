import { NextResponse } from "next/server";
import { importOrderItemsToInventory } from "@/lib/services/orders";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await importOrderItemsToInventory(id);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Ошибка";
    const status = message.includes("не найден") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
