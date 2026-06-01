import { NextResponse } from "next/server";
import {
  getPublicSettingsAsync,
  updateSettingsAsync,
  maskSettings,
  getSettingsAsync,
  saveCartPreferences,
  getCartPreferences,
} from "@/lib/services/settings";
import { parseCartPreferences } from "@/lib/cart/preferences";
import { resolveUserScope } from "@/lib/auth/scope";

export async function GET() {
  try {
    const userId = await resolveUserScope();
    return NextResponse.json({
      settings: await getPublicSettingsAsync(),
      cartPreferences: getCartPreferences(userId),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка загрузки настроек" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const userId = await resolveUserScope();
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
    if (body.fridgeModel !== undefined) {
      patch.fridgeModel =
        body.fridgeModel === "" || body.fridgeModel === null
          ? null
          : String(body.fridgeModel);
    }
    if (body.proverkaChekaToken !== undefined && body.proverkaChekaToken !== "••••••••") {
      patch.proverkaChekaToken =
        body.proverkaChekaToken === "" || body.proverkaChekaToken === null
          ? null
          : String(body.proverkaChekaToken);
    }

    if (body.cartPreferences !== undefined) {
      saveCartPreferences(
        parseCartPreferences(JSON.stringify(body.cartPreferences)),
        userId,
      );
    }

    await updateSettingsAsync(patch);
    return NextResponse.json({
      settings: maskSettings(await getSettingsAsync()),
      cartPreferences: getCartPreferences(userId),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 400 });
  }
}
