import { NextResponse } from "next/server";
import { listOrdersWithItems } from "@/lib/services/orders";

export async function GET() {
  try {
    const orders = listOrdersWithItems();
    return NextResponse.json({ orders });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Не удалось загрузить заказы" },
      { status: 500 },
    );
  }
}
