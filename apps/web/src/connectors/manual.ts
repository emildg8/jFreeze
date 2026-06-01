import type { StoreConnector, ConnectorOrder, ConnectorOrderItem } from "./types";

let pendingManualOrder: ConnectorOrder | null = null;

export function setManualOrder(order: ConnectorOrder) {
  pendingManualOrder = order;
}

export const manualConnector: StoreConnector = {
  id: "manual",
  displayName: "Ручной ввод",
  availability: "active",

  async connect() {
    return { success: true, message: "Добавляйте заказы через форму в настройках" };
  },

  async syncOrders(since: Date): Promise<ConnectorOrder[]> {
    if (!pendingManualOrder) return [];
    if (pendingManualOrder.orderedAt < since) return [];
    const order = pendingManualOrder;
    pendingManualOrder = null;
    return [order];
  },
};

export function buildManualOrder(
  items: ConnectorOrderItem[],
  orderedAt: Date = new Date(),
): ConnectorOrder {
  return {
    externalId: `manual-${Date.now()}`,
    orderedAt,
    items,
  };
}
