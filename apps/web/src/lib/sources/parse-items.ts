import type { ConnectorOrderItem } from "@/connectors/types";

const SKIP =
  /^(итого|сумма|ндс|сдача|получено|оплата|доставка|скидка|баланс|сумма к оплате|всего|чек|фн|фд|инн|ккт)/i;

/** Общий разбор строк товаров из писем и SMS. */
export function extractItemsFromText(text: string): ConnectorOrderItem[] {
  const lines = text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ConnectorOrderItem[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (SKIP.test(line) || line.length < 3) continue;

    // 2 x 89.90 ₽ Молоко
    let m = line.match(
      /^(\d+(?:[.,]\d+)?)\s*(?:x|х|×|\*)\s*(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб\.?)?\s+(.+)$/i,
    );
    if (m) {
      push(items, seen, m[3], parseFloat(m[1].replace(",", ".")));
      continue;
    }

    // Молоко 2 x 89.90
    m = line.match(
      /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:x|х|×|\*)\s*(\d+(?:[.,]\d+)?)/i,
    );
    if (m) {
      push(items, seen, m[1], parseFloat(m[2].replace(",", ".")));
      continue;
    }

    // Молоко .... 199.00 ₽
    m = line.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб\.?)$/i);
    if (m && m[1].length > 2) {
      push(items, seen, m[1], 1);
      continue;
    }

    // Таблица: название;кол-во;цена
    if (line.includes(";")) {
      const cols = line.split(";").map((c) => c.trim());
      if (cols.length >= 2 && cols[0].length > 2 && !SKIP.test(cols[0])) {
        const qty = parseFloat(cols[1].replace(",", ".")) || 1;
        push(items, seen, cols[0], qty);
      }
    }
  }

  return items;
}

function push(
  items: ConnectorOrderItem[],
  seen: Set<string>,
  name: string,
  qty: number,
) {
  const clean = name.replace(/\s+/g, " ").trim();
  if (clean.length < 2 || seen.has(clean.toLowerCase())) return;
  seen.add(clean.toLowerCase());
  items.push({ name: clean, qty: qty || 1, unit: "шт" });
}

export function extractTotalRub(text: string): number | undefined {
  const patterns = [
    /итого[:\s]*(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб)/i,
    /сумма[:\s]*(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб)/i,
    /списан[оа][:\s]*(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб)/i,
    /покупка[:\s]*(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:₽|р\.?|руб\.?)\s*$/im,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const v = parseFloat(m[1].replace(",", ".").replace(/\s/g, ""));
      if (v > 0 && v < 1_000_000) return v;
    }
  }
  return undefined;
}

export function extractDate(text: string): Date {
  const m = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    const d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
