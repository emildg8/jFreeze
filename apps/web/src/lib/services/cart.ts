import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { cartSuggestions } from "@/lib/db/schema";
import {
  suggestSmartCart,
  estimateCartTotal,
  type SmartCartItem,
} from "@/lib/cart/smart-engine";
import { runAiCartAdvisor } from "@/lib/cart/ai-advisor";
import type { CartPreferences } from "@/lib/cart/preferences";
import { getOrderHistoryForCart, listOrdersWithItems } from "./orders";
import { getInventorySnapshot } from "./inventory";
import { getSettings, getCartPreferences, saveCartPreferences } from "./settings";

export function generateCartSuggestions() {
  return generateSmartCartSuggestions(getCartPreferences());
}

export async function generateSmartCartSuggestions(
  prefs?: CartPreferences,
) {
  const settings = getSettings();
  const preferences = prefs ?? getCartPreferences();
  saveCartPreferences(preferences);

  const priceHistory = buildPriceHistoryFromOrders();
  const items = suggestSmartCart(
    getOrderHistoryForCart(),
    getInventorySnapshot(),
    {
      minQtyThreshold: settings.minQtyThreshold,
      historyDays: settings.historyDays,
    },
    preferences,
    priceHistory,
  );

  persistSmartSuggestions(items);

  const aiAdvice = await runAiCartAdvisor({
    items,
    inventory: getInventorySnapshot(),
    prefs: preferences,
    dietaryNotes: preferences.dietaryNotes,
  });

  return {
    suggestions: listCartSuggestions(),
    smart: items,
    estimatedTotal: estimateCartTotal(items),
    aiAdvice,
    preferences,
  };
}

function buildPriceHistoryFromOrders() {
  const orders = listOrdersWithItems();
  const map = new Map<string, { sum: number; count: number }>();

  for (const order of orders) {
    if (!order.totalRub || order.items.length === 0) continue;
    const perItem = order.totalRub / order.items.length;
    for (const item of order.items) {
      const key = item.normalizedName;
      const e = map.get(key) ?? { sum: 0, count: 0 };
      e.sum += perItem;
      e.count += 1;
      map.set(key, e);
    }
  }

  return [...map.entries()].map(([normalizedName, v]) => ({
    normalizedName,
    avgPriceRub: v.sum / v.count,
  }));
}

function persistSmartSuggestions(items: SmartCartItem[]) {
  ensureSeedData();
  const db = getDb();
  const profileId = getSettings().activeProfileId;

  const existing = db
    .select()
    .from(cartSuggestions)
    .all()
    .filter((row) => (row.profileId ?? "default") === profileId);

  for (const row of existing) {
    db.delete(cartSuggestions).where(eq(cartSuggestions.id, row.id)).run();
  }

  const now = new Date();
  for (const s of items) {
    db.insert(cartSuggestions)
      .values({
        id: uuid(),
        profileId,
        name: s.name,
        normalizedName: s.normalizedName,
        suggestedQty: s.suggestedQty,
        unit: s.unit,
        reason: s.reason,
        category: s.category,
        score: s.score,
        estPriceRub: s.estPriceRub,
        compositionTip: s.compositionTip,
        qualityTip: s.qualityTip,
        generatedAt: now,
      })
      .run();
  }
}

export function listCartSuggestions() {
  ensureSeedData();
  const db = getDb();
  const profileId = getSettings().activeProfileId;
  return db
    .select()
    .from(cartSuggestions)
    .all()
    .filter((s) => (s.profileId ?? "default") === profileId);
}
