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
import { buildWeeklySpendSummary } from "@/lib/orders/spend-summary";

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

export function getWeeklySpendSummary() {
  const orders = listOrdersWithItems();
  return buildWeeklySpendSummary(
    orders.map((o) => ({
      storeId: o.storeId,
      orderedAt: o.orderedAt,
      totalRub: o.totalRub,
      items: o.items.map((i) => ({
        normalizedName: i.normalizedName,
        name: i.name,
        qty: i.qty,
        category: i.category,
      })),
    })),
  );
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
