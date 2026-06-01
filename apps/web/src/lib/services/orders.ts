import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { orders, orderItems } from "@/lib/db/schema";
import { normalizeOrderItems } from "@/lib/orders/normalize";
import type { ConnectorOrder } from "@/connectors/types";
import { getSettings } from "./settings";

export function persistConnectorOrders(
  storeId: string,
  connectorOrders: ConnectorOrder[],
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
