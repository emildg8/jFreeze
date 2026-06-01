import { NextResponse } from "next/server";
import { createSmartFridgeProvider } from "@/lib/fridge/smart-fridge";
import { getSettings } from "@/lib/services/settings";
import { upsertInventoryItem } from "@/lib/services/inventory";

export async function POST() {
  try {
    const settings = getSettings();
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

    const fridge = await provider.detectFromImage(Buffer.alloc(0), "fridge");
    const freezer = await provider.detectFromImage(Buffer.alloc(0), "freezer");

    for (const item of fridge) {
      upsertInventoryItem({
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        zone: "fridge",
        source: "smart-fridge",
      });
    }
    for (const item of freezer) {
      upsertInventoryItem({
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        zone: "freezer",
        source: "smart-fridge",
      });
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
