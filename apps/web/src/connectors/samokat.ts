import type { StoreConnector } from "./types";

export const samokatConnector: StoreConnector = {
  id: "samokat",
  displayName: "Самокат (CSV)",
  availability: "beta",

  async connect() {
    return {
      success: true,
      message: "Импортируйте историю через CSV-шаблон в настройках",
    };
  },

  async syncOrders() {
    return [];
  },
};
