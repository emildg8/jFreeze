import type { ConnectorOrder, ConnectorOrderItem } from "@/connectors/types";
import { parseReceiptCsv } from "@/connectors/receipt-csv";
import { parseCsvOrders } from "@/connectors/csv-import";

const SKIP_LINE =
  /^(итого|сумма|ндс|сдача|получено|оплата|карт|visa|master|сбп|чек|фн|фп|фд|рн|инн|ккт|смена|кассир|место|адрес|тел|www|http|сайт|дата|время|розница|магазин|ооо|ао|пао|заказ|спасибо|приход|электронный|покупатель|фискальный)/i;

/** Строка похожа на CSV с заголовком чека */
function looksLikeReceiptCsv(text: string): boolean {
  const first = text.trim().split(/\r?\n/)[0]?.toLowerCase() ?? "";
  return (
    first.includes("товар") ||
    first.includes("наименование") ||
    (first.includes("name") && first.includes(","))
  );
}

function parseRuDate(str: string): Date | null {
  const m = str.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (!m) return null;
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  const d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseLineItem(line: string): ConnectorOrderItem | null {
  const trimmed = line.replace(/\s+/g, " ").trim();
  if (trimmed.length < 2 || SKIP_LINE.test(trimmed)) return null;

  // 2 x 89.90  МОЛОКО  /  МОЛОКО 2 x 89.90  /  МОЛОКО 89.90
  const patternA = trimmed.match(
    /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:x|х|×|\*)\s*(\d+(?:[.,]\d+)?)\s*(?:₽|руб)?/i,
  );
  if (patternA) {
    return {
      name: patternA[1].trim(),
      qty: parseFloat(patternA[2].replace(",", ".")) || 1,
      unit: "шт",
    };
  }

  const patternB = trimmed.match(
    /^(\d+(?:[.,]\d+)?)\s*(?:x|х|×|\*)\s*(\d+(?:[.,]\d+)?)\s+(.+)$/i,
  );
  if (patternB) {
    return {
      name: patternB[3].trim(),
      qty: parseFloat(patternB[1].replace(",", ".")) || 1,
      unit: "шт",
    };
  }

  // Название ... 123.45 ₽
  const patternC = trimmed.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:₽|руб\.?)?$/i);
  if (patternC && !/^\d+$/.test(patternC[1])) {
    const price = parseFloat(patternC[2].replace(",", "."));
    if (price > 0 && price < 100000) {
      return { name: patternC[1].trim(), qty: 1, unit: "шт" };
    }
  }

  // Только название (короткие строки без цифр в конце — пропускаем длинные адреса)
  if (
    trimmed.length >= 3 &&
    trimmed.length < 80 &&
    !/^\d+[.,]?\d*$/.test(trimmed) &&
    !/[=]{3,}/.test(trimmed)
  ) {
    const letters = (trimmed.match(/[а-яА-Яa-zA-Z]/g) ?? []).length;
    if (letters >= trimmed.length * 0.4) {
      return { name: trimmed, qty: 1, unit: "шт" };
    }
  }

  return null;
}

export function parseReceiptText(text: string): ConnectorOrder[] {
  const normalized = text.replace(/\u00a0/g, " ").trim();
  if (!normalized) return [];

  if (looksLikeReceiptCsv(normalized)) {
    try {
      const fromReceipt = parseReceiptCsv(normalized);
      if (fromReceipt.length > 0) return fromReceipt;
    } catch {
      /* fall through */
    }
    try {
      const generic = parseCsvOrders(normalized);
      if (generic.length > 0) return generic;
    } catch {
      /* fall through */
    }
  }

  const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ConnectorOrderItem[] = [];
  let totalRub: number | undefined;
  let orderedAt = new Date();

  for (const line of lines) {
    const dateInLine = line.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
    if (dateInLine) {
      const d = parseRuDate(dateInLine[1]);
      if (d) orderedAt = d;
    }

    if (/^(итого|сумма к оплате|всего)/i.test(line)) {
      const sum = line.match(/(\d+(?:[.,]\d+)?)\s*(?:₽|руб)?/i);
      if (sum) totalRub = parseFloat(sum[1].replace(",", "."));
      continue;
    }

    const item = parseLineItem(line);
    if (item && item.name.length >= 2) {
      items.push(item);
    }
  }

  if (items.length === 0) return [];

  return [
    {
      externalId: `receipt-text-${orderedAt.toISOString().slice(0, 10)}-${Date.now()}`,
      orderedAt,
      totalRub,
      items,
    },
  ];
}
