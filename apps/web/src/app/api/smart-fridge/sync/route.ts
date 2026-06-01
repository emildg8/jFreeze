import { NextResponse } from "next/server";
import { createSmartFridgeProvider } from "@/lib/fridge/smart-fridge";
import { getSettingsForUser } from "@/lib/services/settings";
import { upsertInventoryItem } from "@/lib/services/inventory";
import { getFridgeVisionContextForUser } from "@/lib/fridge/vision";
import { resolveUserScope } from "@/lib/auth/scope";

export async function POST() {
  try {
    const userId = await resolveUserScope();
    const settings = getSettingsForUser(userId);
    const visionContext = getFridgeVisionContextForUser(userId);
    const provider = createSmartFridgeProvider(
      settings.smartFridgeUrl,
      settings.smartFridgeToken,
    );
    if (!provider) {
      return NextResponse.json(
        { error: "Укажите URL умного холодильника в настройках" },
        { status: 400 },
      );
    }

    const fridge = await provider.detectFromImage(
      Buffer.alloc(0),
      "fridge",
      visionContext,
    );
    const freezer = await provider.detectFromImage(
      Buffer.alloc(0),
      "freezer",
      visionContext,
    );

    for (const item of fridge) {
      upsertInventoryItem(
        {
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          zone: "fridge",
          source: "smart-fridge",
        },
        userId,
      );
    }
    for (const item of freezer) {
      upsertInventoryItem(
        {
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          zone: "freezer",
          source: "smart-fridge",
        },
        userId,
      );
    }

    return NextResponse.json({
      imported: fridge.length + freezer.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка синхронизации" },
      { status: 500 },
    );
  }
}
