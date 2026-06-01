import { NextResponse } from "next/server";
import { getWebhookSecret, isTelegramConfigured } from "@/lib/telegram/config";
import { handleTelegramUpdate } from "@/lib/telegram/handlers";
import type { TelegramUpdate } from "@/lib/telegram/types";

export async function POST(request: Request) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: "Telegram не настроен" }, { status: 503 });
  }

  const secret = getWebhookSecret();
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true });
  }
}
