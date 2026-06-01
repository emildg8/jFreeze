import { NextResponse } from "next/server";
import { listStores, connectStore, syncStore } from "@/lib/services/stores";
import type { StoreId } from "@/connectors/types";

export async function GET() {
  try {
    return NextResponse.json({ stores: listStores() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const storeId = body.storeId as StoreId;
    const action = body.action as "connect" | "sync";

    if (action === "connect") {
      const result = await connectStore(storeId);
      return NextResponse.json(result);
    }

    const result = await syncStore(storeId, body.sinceDays ?? 90);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка магазина" }, { status: 400 });
  }
}
