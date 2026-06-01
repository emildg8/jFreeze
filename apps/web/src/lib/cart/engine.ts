import { normalizeProductName } from "@/lib/orders/normalize";

export interface OrderHistoryItem {
  normalizedName: string;
  name: string;
  qty: number;
  unit: string;
  orderedAt: Date;
}

export interface InventorySnapshot {
  normalizedName: string;
  name: string;
  qty: number;
  unit: string;
  zone: "fridge" | "freezer";
}

export interface CartEngineSettings {
  minQtyThreshold: number;
  historyDays: number;
}

export interface CartSuggestionResult {
  name: string;
  normalizedName: string;
  suggestedQty: number;
  unit: string;
  reason: string;
  orderCount: number;
}

export function suggestCart(
  orders: OrderHistoryItem[],
  inventory: InventorySnapshot[],
  settings: CartEngineSettings,
): CartSuggestionResult[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.historyDays);

  const recent = orders.filter((o) => o.orderedAt >= cutoff);
  const frequency = new Map<
    string,
    { name: string; unit: string; count: number; totalQty: number }
  >();

  for (const item of recent) {
    const key = item.normalizedName;
    const existing = frequency.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalQty += item.qty;
    } else {
      frequency.set(key, {
        name: item.name,
        unit: item.unit,
        count: 1,
        totalQty: item.qty,
      });
    }
  }

  const onHand = new Map<string, number>();
  for (const item of inventory) {
    const key = item.normalizedName;
    onHand.set(key, (onHand.get(key) ?? 0) + item.qty);
  }

  const suggestions: CartSuggestionResult[] = [];

  for (const [normalizedName, stats] of frequency) {
    const currentQty = onHand.get(normalizedName) ?? 0;
    if (currentQty >= settings.minQtyThreshold) continue;

    const avgQty = Math.max(1, Math.round(stats.totalQty / stats.count));
    const suggestedQty = Math.max(
      settings.minQtyThreshold - currentQty,
      avgQty,
    );

    let reason: string;
    if (currentQty === 0) {
      reason = `Часто покупаете (${stats.count} раз за ${settings.historyDays} дн.), сейчас нет в запасе`;
    } else {
      reason = `Запас ниже порога (${currentQty} ${stats.unit}), обычно берёте ${avgQty} ${stats.unit}`;
    }

    suggestions.push({
      name: stats.name,
      normalizedName,
      suggestedQty,
      unit: stats.unit,
      reason,
      orderCount: stats.count,
    });
  }

  return suggestions.sort((a, b) => b.orderCount - a.orderCount);
}

export function mergeInventoryByZone(
  items: InventorySnapshot[],
  zone?: "fridge" | "freezer",
): InventorySnapshot[] {
  const filtered = zone ? items.filter((i) => i.zone === zone) : items;
  const merged = new Map<string, InventorySnapshot>();

  for (const item of filtered) {
    const key = normalizeProductName(item.normalizedName);
    const existing = merged.get(key);
    if (existing) {
      existing.qty += item.qty;
    } else {
      merged.set(key, { ...item, normalizedName: key });
    }
  }

  return [...merged.values()];
}
