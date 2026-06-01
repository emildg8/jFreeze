import { NextResponse } from "next/server";
import { listInventory } from "@/lib/services/inventory";
import { listOrdersWithItems } from "@/lib/services/orders";
import { listCartSuggestions, generateCartSuggestions } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";
import { getExpirySummary } from "@/lib/services/expiry";

export async function GET() {
  try {
    const inventory = listInventory();
    const orders = listOrdersWithItems();
    let suggestions = listCartSuggestions();
    if (suggestions.length === 0 && orders.length > 0) {
      await generateCartSuggestions();
      suggestions = listCartSuggestions();
    }
    const settings = getSettings();

    return NextResponse.json({
      inventoryCount: inventory.length,
      orderCount: orders.length,
      cartCount: suggestions.length,
      expiry: getExpirySummary(),
      settings: {
        onboardingDone: settings.onboardingDone,
        plan: settings.plan,
        activeProfileId: settings.activeProfileId,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
