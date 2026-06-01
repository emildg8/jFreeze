import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getFamilyInboxItem } from "@/lib/services/telegram";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const item = getFamilyInboxItem(id);
    if (!item || !fs.existsSync(item.filePath)) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    const buffer = fs.readFileSync(item.filePath);
    const mime =
      item.mimeType ??
      (item.kind === "photo" ? "image/jpeg" : "application/octet-stream");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${path.basename(item.fileName ?? item.id)}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
