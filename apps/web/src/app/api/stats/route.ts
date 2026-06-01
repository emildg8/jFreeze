import { NextResponse } from "next/server";
import { listInventory } from "@/lib/services/inventory";
import { getWeeklySpendSummary, listOrdersWithItems } from "@/lib/services/orders";
import { maybeRunImapAutoSync } from "@/lib/services/store-sources";
import { listCartSuggestions, generateCartSuggestions } from "@/lib/services/cart";
import { getSettingsAsync } from "@/lib/services/settings";
import { getExpirySummary } from "@/lib/services/expiry";
import { runRemindersTick } from "@/lib/reminders/tick";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { resolveUserScope } from "@/lib/auth/scope";

export async function GET() {
  try {
    if (isTelegramConfigured()) {
      void runRemindersTick().catch((e) => console.error("reminders tick", e));
    }
    void maybeRunImapAutoSync().catch((e) => console.error("imap auto sync", e));
    const userId = await resolveUserScope();
    const inventory = listInventory(userId);
    const orders = await listOrdersWithItems(userId);
    let suggestions = listCartSuggestions(userId);
    if (suggestions.length === 0 && orders.length > 0) {
      await generateCartSuggestions();
      suggestions = listCartSuggestions(userId);
    }
    const settings = await getSettingsAsync();

    return NextResponse.json({
      inventoryCount: inventory.length,
      orderCount: orders.length,
      cartCount: suggestions.length,
      weekly: await getWeeklySpendSummary(),
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
