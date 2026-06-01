import { NextResponse } from "next/server";
import {
  getPublicSettings,
  updateSettings,
  maskSettings,
  getSettings,
  saveCartPreferences,
  getCartPreferences,
} from "@/lib/services/settings";
import { parseCartPreferences } from "@/lib/cart/preferences";

export async function GET() {
  try {
    return NextResponse.json({
      settings: getPublicSettings(),
      cartPreferences: getCartPreferences(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка загрузки настроек" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body.minQtyThreshold !== undefined) patch.minQtyThreshold = body.minQtyThreshold;
    if (body.historyDays !== undefined) patch.historyDays = body.historyDays;
    if (body.onboardingDone !== undefined) patch.onboardingDone = body.onboardingDone;
    if (body.expiryRemindersEnabled !== undefined) {
      patch.expiryRemindersEnabled = body.expiryRemindersEnabled;
    }
    if (body.pushEnabled !== undefined) patch.pushEnabled = body.pushEnabled;
    if (body.activeProfileId !== undefined) patch.activeProfileId = body.activeProfileId;
    if (body.plan === "free" || body.plan === "pro") patch.plan = body.plan;

    if (body.openaiApiKey !== undefined && body.openaiApiKey !== "••••••••") {
      patch.openaiApiKey =
        body.openaiApiKey === "" || body.openaiApiKey === null
          ? null
          : String(body.openaiApiKey);
    }
    if (body.smartFridgeUrl !== undefined) {
      patch.smartFridgeUrl = body.smartFridgeUrl || null;
    }
    if (body.smartFridgeToken !== undefined && body.smartFridgeToken !== "••••••••") {
      patch.smartFridgeToken =
        body.smartFridgeToken === "" || body.smartFridgeToken === null
          ? null
          : String(body.smartFridgeToken);
    }

    if (body.cartPreferences !== undefined) {
      saveCartPreferences(parseCartPreferences(JSON.stringify(body.cartPreferences)));
    }

    updateSettings(patch);
    return NextResponse.json({
      settings: maskSettings(getSettings()),
      cartPreferences: getCartPreferences(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 400 });
  }
}
