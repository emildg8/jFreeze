import type { StoreConnector } from "./types";

export const pyaterochkaConnector: StoreConnector = {
  id: "pyaterochka",
  displayName: "Пятёрочка (CSV)",
  availability: "beta",

  async connect() {
    return {
      success: true,
      message: "Используйте шаблон «Пятёрочка» в настройках → Импорт CSV",
    };
  },

  async syncOrders() {
    return [];
  },
};
