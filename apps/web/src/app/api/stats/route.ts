import { NextResponse } from "next/server";
import { listInventory } from "@/lib/services/inventory";
import { getWeeklySpendSummary, listOrdersWithItems } from "@/lib/services/orders";
import { maybeRunImapAutoSync } from "@/lib/services/store-sources";
import { listCartSuggestions, generateCartSuggestions } from "@/lib/services/cart";
import { getSettings } from "@/lib/services/settings";
import { getExpirySummary } from "@/lib/services/expiry";
import { runRemindersTick } from "@/lib/reminders/tick";
import { isTelegramConfigured } from "@/lib/telegram/config";

export async function GET() {
  try {
    if (isTelegramConfigured()) {
      void runRemindersTick().catch((e) => console.error("reminders tick", e));
    }
    void maybeRunImapAutoSync().catch((e) => console.error("imap auto sync", e));
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
      weekly: getWeeklySpendSummary(),
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
