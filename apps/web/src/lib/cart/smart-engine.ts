import {
  suggestCart,
  type OrderHistoryItem,
  type InventorySnapshot,
  type CartEngineSettings,
  type CartSuggestionResult,
} from "./engine";
import type { CartPreferences } from "./preferences";
import {
  inferCategory,
  getProductHint,
  estimatePriceRub,
  scoreProduct,
} from "./product-knowledge";

export interface SmartCartItem extends CartSuggestionResult {
  category: string;
  score: number;
  estPriceRub: number;
  compositionTip: string;
  qualityTip: string;
  priorityLabel: string;
}

export interface OrderPriceHistory {
  normalizedName: string;
  avgPriceRub: number;
}

function buildPriorityLabel(priority: CartPreferences["priority"]): string {
  const map: Record<CartPreferences["priority"], string> = {
    balanced: "баланс цена/качество/состав",
    price: "приоритет цены",
    quality: "приоритет качества",
    health: "приоритет состава и пользы",
  };
  return map[priority];
}

export function suggestSmartCart(
  orders: OrderHistoryItem[],
  inventory: InventorySnapshot[],
  engineSettings: CartEngineSettings,
  prefs: CartPreferences,
  priceHistory: OrderPriceHistory[] = [],
): SmartCartItem[] {
  const base = suggestCart(orders, inventory, engineSettings);
  const priceMap = new Map(priceHistory.map((p) => [p.normalizedName, p.avgPriceRub]));

  const exclude = new Set(
    [
      ...prefs.excludeCategories,
      ...(prefs.excludeBakery ? ["бакалея", "выпечка"] : []),
    ].map((c) => c.toLowerCase()),
  );

  let items: SmartCartItem[] = base
    .map((item) => {
      const category = inferCategory(item.normalizedName);
      const hint = getProductHint(item.normalizedName);
      const estPriceRub =
        estimatePriceRub(item.normalizedName, priceMap.get(item.normalizedName)) *
        item.suggestedQty;
      const score = scoreProduct(item.normalizedName, prefs.priority);

      const reason = hint
        ? `${item.reason} · ${hint.qualityTip.slice(0, 60)}…`
        : item.reason;

      return {
        ...item,
        reason,
        category,
        score,
        estPriceRub,
        compositionTip: hint?.compositionTip ?? "Проверьте состав на упаковке.",
        qualityTip: hint?.qualityTip ?? "Сравните 2–3 варианта в магазине.",
        priorityLabel: buildPriorityLabel(prefs.priority),
      };
    })
    .filter((item) => !exclude.has(item.category.toLowerCase()));

  if (prefs.preferSimpleComposition) {
    items = items.filter((item) => {
      const h = getProductHint(item.normalizedName);
      return !h || h.healthScore >= 5;
    });
  }

  items.sort((a, b) => b.score - a.score || b.orderCount - a.orderCount);

  if (prefs.maxItems > 0 && items.length > prefs.maxItems) {
    items = items.slice(0, prefs.maxItems);
  }

  if (prefs.budgetRub && prefs.budgetRub > 0) {
    let total = 0;
    const withinBudget: SmartCartItem[] = [];
    for (const item of items) {
      if (total + item.estPriceRub <= prefs.budgetRub) {
        withinBudget.push(item);
        total += item.estPriceRub;
      }
    }
    if (withinBudget.length > 0) items = withinBudget;
  }

  return items;
}

export function estimateCartTotal(items: SmartCartItem[]): number {
  return Math.round(items.reduce((s, i) => s + i.estPriceRub, 0));
}
