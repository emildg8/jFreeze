import { NextResponse } from "next/server";
import { getSettings, updateSettings, isPro } from "@/lib/services/settings";

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json({
      plan: settings.plan,
      isPro: isPro(),
      features: {
        aiVision: isPro() || Boolean(settings.openaiApiKey),
        familyProfiles: isPro(),
        smartFridge: true,
        pushNotifications: true,
        csvTemplates: true,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "activate_trial") {
      updateSettings({ plan: "pro" });
      return NextResponse.json({
        plan: "pro",
        message: "Pro активирован. AI-фото доступно (нужен OPENAI_API_KEY на сервере или свой ключ).",
      });
    }
    if (body.action === "deactivate") {
      updateSettings({ plan: "free" });
      return NextResponse.json({ plan: "free", message: "Переключено на бесплатный план" });
    }
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 400 });
  }
}
