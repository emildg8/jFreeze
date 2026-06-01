import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { orders, orderItems } from "@/lib/db/schema";
import { normalizeOrderItems } from "@/lib/orders/normalize";
import type { ConnectorOrder } from "@/connectors/types";
import { getSettings } from "./settings";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { notifyTelegramNewOrders } from "@/lib/telegram/notify";

export function persistConnectorOrders(
  storeId: string,
  connectorOrders: ConnectorOrder[],
  options?: { notifyTelegram?: boolean },
) {
  ensureSeedData();
  const db = getDb();
  const profileId = getSettings().activeProfileId;
  const created: string[] = [];

  for (const order of connectorOrders) {
    const orderId = uuid();
    const items = normalizeOrderItems(order.items);
    db.insert(orders)
      .values({
        id: orderId,
        storeId,
        profileId,
        orderedAt: order.orderedAt,
        externalId: order.externalId,
        totalRub: order.totalRub,
        createdAt: new Date(),
      })
      .run();

    for (const item of items) {
      db.insert(orderItems)
        .values({
          id: uuid(),
          orderId,
          name: item.name,
          normalizedName: item.normalizedName,
          qty: item.qty,
          unit: item.unit,
          category: item.category,
        })
        .run();
    }
    created.push(orderId);
  }

  if (
    created.length > 0 &&
    options?.notifyTelegram !== false &&
    isTelegramConfigured()
  ) {
    void notifyTelegramNewOrders(created.length, storeId);
  }

  return created;
}

export function listOrdersWithItems() {
  ensureSeedData();
  const db = getDb();
  const profileId = getSettings().activeProfileId;
  const allOrders = db
    .select()
    .from(orders)
    .all()
    .filter((o) => (o.profileId ?? "default") === profileId);

  const result = allOrders.map((order) => ({
    ...order,
    items: db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .all(),
  }));
  return result.sort(
    (a, b) => b.orderedAt.getTime() - a.orderedAt.getTime(),
  );
}

export function repeatLastOrder(): { imported: number; storeId: string } | null {
  const orders = listOrdersWithItems();
  const last = orders[0];
  if (!last?.items.length) return null;

  const created = persistConnectorOrders(last.storeId, [
    {
      externalId: `repeat-${last.id}-${Date.now()}`,
      orderedAt: new Date(),
      totalRub: last.totalRub ?? undefined,
      items: last.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unit: i.unit ?? "шт",
        category: i.category ?? undefined,
      })),
    },
  ]);

  return { imported: created.length, storeId: last.storeId };
}

export function getWeeklySpendSummary(): {
  totalRub: number;
  orderCount: number;
  byStore: Array<{ storeId: string; totalRub: number; count: number }>;
} {
  const orders = listOrdersWithItems();
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);

  const recent = orders.filter((o) => o.orderedAt >= since);
  const byStoreMap = new Map<string, { totalRub: number; count: number }>();
  let totalRub = 0;

  for (const o of recent) {
    const sum = o.totalRub ?? o.items.reduce((acc, i) => acc + i.qty, 0);
    totalRub += sum;
    const cur = byStoreMap.get(o.storeId) ?? { totalRub: 0, count: 0 };
    cur.totalRub += sum;
    cur.count += 1;
    byStoreMap.set(o.storeId, cur);
  }

  const byStore = [...byStoreMap.entries()]
    .map(([storeId, v]) => ({ storeId, ...v }))
    .sort((a, b) => b.totalRub - a.totalRub);

  return { totalRub, orderCount: recent.length, byStore };
}

export function getOrderHistoryForCart() {
  const data = listOrdersWithItems();
  return data.flatMap((order) =>
    order.items.map((item) => ({
      normalizedName: item.normalizedName,
      name: item.name,
      qty: item.qty,
      unit: item.unit ?? "шт",
      orderedAt: order.orderedAt,
    })),
  );
}
