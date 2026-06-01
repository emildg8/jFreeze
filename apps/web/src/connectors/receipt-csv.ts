import type { ConnectorOrder } from "./types";
import { parseCsvHeader } from "@/lib/csv/parse-headers";

export function parseReceiptCsv(csv: string): ConnectorOrder[] {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) return [];

  const { nameIdx, qtyIdx, dateIdx } = parseCsvHeader(lines[0]);
  if (nameIdx === -1) {
    throw new Error("Чек: нужна колонка «товар» или «наименование»");
  }

  const byDate = new Map<string, ConnectorOrder>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx];
    if (!name || /^итого$/i.test(name)) continue;

    const qty = qtyIdx >= 0 ? parseFloat(cols[qtyIdx].replace(",", ".")) || 1 : 1;
    const dateStr = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
    const orderedAt = new Date(dateStr);
    const key = orderedAt.toISOString().slice(0, 10);

    if (!byDate.has(key)) {
      byDate.set(key, { externalId: `receipt-${key}`, orderedAt, items: [] });
    }
    byDate.get(key)!.items.push({ name, qty, unit: "шт" });
  }

  return [...byDate.values()];
}
