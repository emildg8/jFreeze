import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { stores } from "@/lib/db/schema";
import { getConnector, type StoreId } from "@/connectors";
import { getStoreLabel } from "@/lib/constants/stores";
import { persistConnectorOrders } from "./orders";

export function listStores() {
  ensureSeedData();
  const db = getDb();
  return db.select().from(stores).all().map((s) => ({
    ...s,
    label: getStoreLabel(s.id),
  }));
}

export async function syncStore(storeId: StoreId, sinceDays = 90) {
  const connector = getConnector(storeId);

  if (connector.availability === "planned") {
    return {
      imported: 0,
      message: connector.displayName + ": интеграция в разработке. Используйте CSV.",
    };
  }

  if (connector.availability === "beta") {
    return {
      imported: 0,
      message: `${connector.displayName}: импортируйте заказы через CSV в настройках (шаблон «${connector.displayName}»).`,
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const connectorOrders = await connector.syncOrders(since);
  const created = persistConnectorOrders(storeId, connectorOrders);

  if (created.length > 0) {
    const db = getDb();
    db.update(stores)
      .set({ connectedAt: new Date(), availability: "active" })
      .where(eq(stores.id, storeId))
      .run();
  }

  return {
    imported: created.length,
    orders: connectorOrders,
    message:
      created.length > 0
        ? `Импортировано заказов: ${created.length}`
        : "Новых заказов нет",
  };
}

export async function connectStore(storeId: StoreId) {
  const connector = getConnector(storeId);
  return connector.connect();
}
