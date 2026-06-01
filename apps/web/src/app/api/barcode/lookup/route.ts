import { NextResponse } from "next/server";
import { lookupBarcodeProduct } from "@/lib/barcode/lookup";

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code");
    if (!code?.trim()) {
      return NextResponse.json({ error: "Укажите code" }, { status: 400 });
    }

    const product = await lookupBarcodeProduct(code.trim());
    if (!product) {
      return NextResponse.json({ found: false, barcode: code.replace(/\D/g, "") });
    }

    return NextResponse.json({ found: true, product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка поиска" }, { status: 500 });
  }
}
