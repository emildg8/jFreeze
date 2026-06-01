import { NextResponse } from "next/server";
import {
  processEmailImport,
  processSmsImport,
} from "@/lib/services/store-sources";
import type { StoreId } from "@/connectors/types";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let channel: "email" | "sms" = "email";
    let text: string | undefined;
    let eml: string | undefined;
    let storeId: StoreId | undefined;
    let autoImport = true;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      channel = (form.get("channel") as "email" | "sms") ?? "email";
      text = (form.get("text") as string) || undefined;
      storeId = (form.get("storeId") as StoreId) || undefined;
      autoImport = form.get("autoImport") !== "false";
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        eml = await file.text();
      }
    } else {
      const body = await request.json();
      channel = body.channel ?? "email";
      text = body.text;
      eml = body.eml;
      storeId = body.storeId;
      autoImport = body.autoImport !== false;
    }

    if (channel === "sms") {
      if (!text?.trim()) {
        return NextResponse.json({ error: "Вставьте текст SMS" }, { status: 400 });
      }
      const result = processSmsImport({
        text: text.trim(),
        storeId,
        autoImport,
      });
      return NextResponse.json(result);
    }

    if (!text?.trim() && !eml?.trim()) {
      return NextResponse.json(
        { error: "Вставьте текст письма или загрузите .eml" },
        { status: 400 },
      );
    }

    const result = processEmailImport({
      text: text?.trim(),
      eml: eml?.trim(),
      storeId,
      autoImport,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка импорта" }, { status: 400 });
  }
}
