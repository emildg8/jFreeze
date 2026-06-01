import type { StoreConnector } from "./types";

export const perekrestokConnector: StoreConnector = {
  id: "perekrestok",
  displayName: "Перекрёсток (CSV)",
  availability: "beta",

  async connect() {
    return {
      success: true,
      message: "Используйте универсальный или чековый шаблон CSV",
    };
  },

  async syncOrders() {
    return [];
  },
};
