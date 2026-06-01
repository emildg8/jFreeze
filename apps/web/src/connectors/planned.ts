import type { StoreConnector, StoreId } from "./types";

export function createPlannedConnector(
  id: StoreId,
  displayName: string,
  message: string,
): StoreConnector {
  return {
    id,
    displayName,
    availability: "planned",
    async connect() {
      return { success: false, message };
    },
    async syncOrders() {
      return [];
    },
  };
}
