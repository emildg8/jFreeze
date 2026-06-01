import { NextResponse } from "next/server";
import {
  createTelegramLinkToken,
  listTelegramStatus,
} from "@/lib/services/telegram";
import { isTelegramConfigured } from "@/lib/telegram/config";

export async function GET() {
  try {
    return NextResponse.json(listTelegramStatus());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function POST() {
  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "Задайте TELEGRAM_BOT_TOKEN в .env.local" },
      { status: 503 },
    );
  }
  try {
    const { token, expiresAt } = createTelegramLinkToken();
    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      hint: `В Telegram боту: /link ${token}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не удалось создать код" }, { status: 500 });
  }
}
