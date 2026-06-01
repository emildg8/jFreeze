import { NextResponse } from "next/server";
import {
  getSettingsForUser,
  updateSettingsForUser,
  isPro,
} from "@/lib/services/settings";
import { resolveUserScope } from "@/lib/auth/scope";

export async function GET() {
  try {
    const userId = await resolveUserScope();
    const settings = getSettingsForUser(userId);
    const pro = isPro(userId);
    return NextResponse.json({
      plan: settings.plan,
      isPro: pro,
      features: {
        aiVision: pro || Boolean(settings.openaiApiKey),
        familyProfiles: pro,
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
    const userId = await resolveUserScope();
    const body = await request.json();
    if (body.action === "activate_trial") {
      updateSettingsForUser(userId, { plan: "pro" });
      return NextResponse.json({
        plan: "pro",
        message:
          "Демо Pro включён (без оплаты). AI-фото — только с вашим OPENAI_API_KEY; иначе бесплатная эвристика.",
      });
    }
    if (body.action === "deactivate") {
      updateSettingsForUser(userId, { plan: "free" });
      return NextResponse.json({ plan: "free", message: "Переключено на бесплатный план" });
    }
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 400 });
  }
}
