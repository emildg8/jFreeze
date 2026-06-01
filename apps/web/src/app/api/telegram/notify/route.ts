import { NextResponse } from "next/server";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { notifyTelegramExpiryForActiveProfile } from "@/lib/telegram/notify";

export async function POST() {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: "Telegram не настроен" }, { status: 503 });
  }
  try {
    await notifyTelegramExpiryForActiveProfile();
    return NextResponse.json({ ok: true, message: "Уведомления отправлены" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
