import type { StoreConnector, ConnectorOrder } from "./types";
import { parseCsvHeader } from "@/lib/csv/parse-headers";

export function parseCsvOrders(csv: string): ConnectorOrder[] {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const { nameIdx, qtyIdx, dateIdx, unitIdx } = parseCsvHeader(lines[0]);

  if (nameIdx === -1) {
    throw new Error(
      "Нужна колонка: name, товар, наименование или product_name",
    );
  }

  const byDate = new Map<string, ConnectorOrder>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx];
    if (!name || /^итого$/i.test(name)) continue;

    const qty = qtyIdx >= 0 ? parseFloat(cols[qtyIdx].replace(",", ".")) || 1 : 1;
    const unit = unitIdx >= 0 ? cols[unitIdx] || "шт" : "шт";
    const dateStr = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
    const orderedAt = new Date(dateStr);
    if (Number.isNaN(orderedAt.getTime())) continue;

    const key = orderedAt.toISOString().slice(0, 10);

    if (!byDate.has(key)) {
      byDate.set(key, {
        externalId: `csv-${key}-${i}`,
        orderedAt,
        items: [],
      });
    }
    byDate.get(key)!.items.push({ name, qty, unit });
  }

  return [...byDate.values()];
}

export const csvConnector: StoreConnector = {
  id: "csv",
  displayName: "CSV / JSON",
  availability: "active",

  async connect() {
    return {
      success: true,
      message: "Загрузите CSV в настройках (шаблоны: универсальный, чек, Озон, Пятёрочка)",
    };
  },

  async syncOrders() {
    return [];
  },
};
