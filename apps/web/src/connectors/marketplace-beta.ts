import type { StoreConnector, StoreId } from "./types";

function beta(id: StoreId, displayName: string): StoreConnector {
  return {
    id,
    displayName,
    availability: "beta",
    async connect() {
      return {
        success: true,
        message: `«${displayName}»: включите в «Источники» и вставьте письма или SMS с заказами`,
      };
    },
    async syncOrders() {
      return [];
    },
  };
}

export const wildberriesConnector = beta("wildberries", "Wildberries");
export const yandexLavkaConnector = beta("yandex_lavka", "Яндекс Лавка");
export const magnitConnector = beta("magnit", "Магнит");
