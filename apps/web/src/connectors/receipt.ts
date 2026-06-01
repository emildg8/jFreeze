import type { StoreConnector } from "./types";

/** Импорт через /api/receipts/import (фото, PDF, почта). */
export const receiptConnector: StoreConnector = {
  id: "receipt",
  displayName: "Чек",
  availability: "active",
  async connect() {
    return {
      success: true,
      message: "Загрузите чек на странице «Заказы»",
    };
  },
  async syncOrders() {
    return [];
  },
};
