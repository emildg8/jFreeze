import { inferCategory } from "@/lib/cart/product-knowledge";

export interface OrderItemForSpend {
  normalizedName: string;
  name: string;
  qty: number;
  category?: string | null;
}

export interface OrderForSpend {
  orderedAt: Date;
  totalRub: number | null;
  items: OrderItemForSpend[];
}

export interface CategorySpendRow {
  category: string;
  totalRub: number;
  itemCount: number;
}

export interface WeeklySpendSummary {
  totalRub: number;
  orderCount: number;
  byStore: Array<{ storeId: string; totalRub: number; count: number }>;
  byCategory: CategorySpendRow[];
}

/** Распределяет сумму заказа по позициям пропорционально количеству. */
export function allocateOrderSpendByCategory(
  order: OrderForSpend,
): Map<string, { totalRub: number; itemCount: number }> {
  const map = new Map<string, { totalRub: number; itemCount: number }>();
  if (!order.items.length) return map;

  const orderTotal =
    order.totalRub ??
    order.items.reduce((acc, i) => acc + Math.max(i.qty, 1), 0);

  const weightSum =
    order.items.reduce((acc, i) => acc + Math.max(i.qty, 0.01), 0) ||
    order.items.length;

  for (const item of order.items) {
    const category =
      item.category?.trim() || inferCategory(item.normalizedName || item.name);
    const share = (Math.max(item.qty, 0.01) / weightSum) * orderTotal;
    const cur = map.get(category) ?? { totalRub: 0, itemCount: 0 };
    cur.totalRub += share;
    cur.itemCount += 1;
    map.set(category, cur);
  }

  return map;
}

export function buildWeeklySpendSummary(
  orders: Array<OrderForSpend & { storeId: string }>,
  days = 7,
): WeeklySpendSummary {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const recent = orders.filter((o) => o.orderedAt >= since);
  const byStoreMap = new Map<string, { totalRub: number; count: number }>();
  const byCategoryMap = new Map<string, { totalRub: number; itemCount: number }>();
  let totalRub = 0;

  for (const o of recent) {
    const sum =
      o.totalRub ?? o.items.reduce((acc, i) => acc + Math.max(i.qty, 1), 0);
    totalRub += sum;

    const storeCur = byStoreMap.get(o.storeId) ?? { totalRub: 0, count: 0 };
    storeCur.totalRub += sum;
    storeCur.count += 1;
    byStoreMap.set(o.storeId, storeCur);

    for (const [cat, v] of allocateOrderSpendByCategory(o)) {
      const cur = byCategoryMap.get(cat) ?? { totalRub: 0, itemCount: 0 };
      cur.totalRub += v.totalRub;
      cur.itemCount += v.itemCount;
      byCategoryMap.set(cat, cur);
    }
  }

  const byStore = [...byStoreMap.entries()]
    .map(([storeId, v]) => ({ storeId, ...v }))
    .sort((a, b) => b.totalRub - a.totalRub);

  const byCategory = [...byCategoryMap.entries()]
    .map(([category, v]) => ({
      category,
      totalRub: Math.round(v.totalRub),
      itemCount: v.itemCount,
    }))
    .sort((a, b) => b.totalRub - a.totalRub);

  return {
    totalRub: Math.round(totalRub),
    orderCount: recent.length,
    byStore,
    byCategory,
  };
}
