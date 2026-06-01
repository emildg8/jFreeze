import type { StoreConnector, StoreId } from "./types";
import { demoConnector } from "./demo";
import { manualConnector } from "./manual";
import { csvConnector } from "./csv-import";
import { ozonConnector } from "./ozon";
import { samokatConnector } from "./samokat";
import { pyaterochkaConnector } from "./pyaterochka";
import { perekrestokConnector } from "./perekrestok";
import { receiptConnector } from "./receipt";
import {
  wildberriesConnector,
  yandexLavkaConnector,
  magnitConnector,
} from "./marketplace-beta";

const connectors: Record<StoreId, StoreConnector> = {
  demo: demoConnector,
  manual: manualConnector,
  csv: csvConnector,
  receipt: receiptConnector,
  ozon: ozonConnector,
  samokat: samokatConnector,
  pyaterochka: pyaterochkaConnector,
  perekrestok: perekrestokConnector,
  wildberries: wildberriesConnector,
  yandex_lavka: yandexLavkaConnector,
  magnit: magnitConnector,
};

export function getConnector(id: StoreId): StoreConnector {
  return connectors[id];
}

export function getAllConnectors(): StoreConnector[] {
  return Object.values(connectors);
}

export * from "./types";
export { parseCsvOrders } from "./csv-import";
export { setManualOrder, buildManualOrder } from "./manual";
