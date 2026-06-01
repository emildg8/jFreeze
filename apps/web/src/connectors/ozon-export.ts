import type { StoreConnector, ConnectorOrder } from "./types";

/** Бета: импорт CSV-экспорта заказов Озон (product_name, quantity, order_date) */
export function parseOzonExportCsv(csv: string): ConnectorOrder[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.findIndex(
    (h) => h.includes("product") || h.includes("name") || h.includes("товар"),
  );
  const qtyIdx = header.findIndex((h) => h.includes("qty") || h.includes("quantity"));
  const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("дата"));

  const byDate = new Map<string, ConnectorOrder>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx >= 0 ? nameIdx : 0];
    if (!name) continue;
    const qty = qtyIdx >= 0 ? parseFloat(cols[qtyIdx]) || 1 : 1;
    const dateStr = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
    const orderedAt = new Date(dateStr);
    const key = orderedAt.toISOString().slice(0, 10);
    if (!byDate.has(key)) {
      byDate.set(key, { externalId: `ozon-${key}`, orderedAt, items: [] });
    }
    byDate.get(key)!.items.push({ name, qty, unit: "шт", category: "ozon" });
  }
  return [...byDate.values()];
}

export const ozonExportConnector: StoreConnector = {
  id: "ozon",
  displayName: "Озон (CSV-экспорт)",
  availability: "beta",

  async connect() {
    return {
      success: true,
      message: "Загрузите CSV-экспорт заказов в настройках (шаблон «Озон»)",
    };
  },

  async syncOrders() {
    return [];
  },
};
