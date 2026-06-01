import type { StoreConnector, ConnectorOrder } from "./types";

export const demoConnector: StoreConnector = {
  id: "demo",
  displayName: "Демо-магазин",
  availability: "active",

  async connect() {
    return { success: true, message: "Демо-данные готовы к загрузке" };
  },

  async syncOrders(since: Date): Promise<ConnectorOrder[]> {
    const now = new Date();
    const orders: ConnectorOrder[] = [
      {
        externalId: "demo-001",
        orderedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        totalRub: 1240,
        items: [
          { name: "Молоко 2.5% 1л", qty: 2, unit: "шт", category: "молочные" },
          { name: "Хлеб белый", qty: 1, unit: "шт", category: "выпечка" },
          { name: "Яйца С1 10шт", qty: 1, unit: "уп", category: "молочные" },
          { name: "Куриная грудка", qty: 0.5, unit: "кг", category: "мясо" },
        ],
      },
      {
        externalId: "demo-002",
        orderedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        totalRub: 890,
        items: [
          { name: "Молоко 2.5% 1л", qty: 1, unit: "шт", category: "молочные" },
          { name: "Сыр Российский 200г", qty: 1, unit: "шт", category: "молочные" },
          { name: "Помидоры", qty: 0.6, unit: "кг", category: "овощи" },
          { name: "Огурцы", qty: 0.5, unit: "кг", category: "овощи" },
        ],
      },
      {
        externalId: "demo-003",
        orderedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
        totalRub: 1560,
        items: [
          { name: "Йогурт натуральный", qty: 4, unit: "шт", category: "молочные" },
          { name: "Бананы", qty: 1, unit: "кг", category: "фрукты" },
          { name: "Гречка", qty: 1, unit: "уп", category: "бакалея" },
          { name: "Масло сливочное 82%", qty: 1, unit: "шт", category: "молочные" },
        ],
      },
      {
        externalId: "demo-004",
        orderedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        totalRub: 720,
        items: [
          { name: "Молоко 2.5% 1л", qty: 2, unit: "шт", category: "молочные" },
          { name: "Творог 5%", qty: 2, unit: "шт", category: "молочные" },
          { name: "Яблоки", qty: 1, unit: "кг", category: "фрукты" },
        ],
      },
    ];
    return orders.filter((o) => o.orderedAt >= since);
  },
};
