import { NextResponse } from "next/server";
import { repeatLastOrder } from "@/lib/services/orders";

export async function POST() {
  try {
    const result = repeatLastOrder();
    if (!result) {
      return NextResponse.json(
        { error: "Нет заказов для повтора" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      imported: result.imported,
      storeId: result.storeId,
      message: "Последний заказ скопирован в историю",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
