import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { orders, orderItems } from "@/lib/db/schema";
import { normalizeOrderItems } from "@/lib/orders/normalize";
import type { ConnectorOrder } from "@/connectors/types";
import { getSettingsForUser } from "./settings";
import { resolveUserScope } from "@/lib/auth/scope";
import { GUEST_USER_ID } from "@/lib/auth/scope";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { notifyTelegramNewOrders } from "@/lib/telegram/notify";
import { buildWeeklySpendSummary } from "@/lib/orders/spend-summary";
import { defaultExpiryDate } from "@/lib/cart/product-knowledge";
import { listInventory, upsertInventoryItem } from "./inventory";

export async function persistConnectorOrders(
  storeId: string,
  connectorOrders: ConnectorOrder[],
  options?: { notifyTelegram?: boolean; userId?: string },
) {
  ensureSeedData();
  const db = getDb();
  const userId = options?.userId ?? (await resolveUserScope());
  const profileId = getSettingsForUser(userId).activeProfileId;
  const created: string[] = [];

  for (const order of connectorOrders) {
    const orderId = uuid();
    const items = normalizeOrderItems(order.items);
    db.insert(orders)
      .values({
        id: orderId,
        userId,
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

export async function listOrdersWithItems(userId?: string) {
  ensureSeedData();
  const db = getDb();
  const uid = userId ?? (await resolveUserScope());
  const profileId = getSettingsForUser(uid).activeProfileId;
  const allOrders = db
    .select()
    .from(orders)
    .all()
    .filter(
      (o) =>
        (o.userId ?? GUEST_USER_ID) === uid &&
        (o.profileId ?? "default") === profileId,
    );

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

export async function repeatLastOrder(): Promise<{
  imported: number;
  storeId: string;
} | null> {
  const orders = await listOrdersWithItems();
  const last = orders[0];
  if (!last?.items.length) return null;

  const created = await persistConnectorOrders(last.storeId, [
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

export async function getWeeklySpendSummary(userId?: string) {
  const orders = await listOrdersWithItems(userId);
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

export async function getOrderHistoryForCart(userId?: string) {
  const data = await listOrdersWithItems(userId);
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

/** Перенос позиций заказа в холодильник (замыкание цикла «покупка → запасы»). */
export async function importOrderItemsToInventory(
  orderId: string,
  userId?: string,
) {
  const uid = userId ?? (await resolveUserScope());
  const orders = await listOrdersWithItems(uid);
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Заказ не найден");
  if (order.items.length === 0) throw new Error("В заказе нет позиций");

  const inventory = listInventory(uid);
  let added = 0;

  for (const item of order.items) {
    const existing = inventory.find(
      (i) =>
        i.normalizedName === item.normalizedName &&
        (i.zone === "fridge" || i.zone === "freezer"),
    );
    upsertInventoryItem(
      {
        name: item.name,
        qty: (existing?.qty ?? 0) + item.qty,
        unit: item.unit ?? "шт",
        zone: "fridge",
        expiryAt: existing?.expiryAt ?? defaultExpiryDate(item.normalizedName),
        source: "order",
      },
      uid,
    );
    added += 1;
  }

  return { added, orderId };
}
