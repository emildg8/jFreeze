import type { ConnectorOrder } from "@/connectors/types";
import type { StoreId } from "@/connectors/types";
import { extractTextFromEml, normalizeEmailPaste } from "@/lib/receipt/eml-parser";
import { parseReceiptText } from "@/lib/receipt/text-parser";
import { detectFromEmail } from "./detect";
import type { ParsedSourceImport } from "./types";
import { extractDate, extractItemsFromText, extractTotalRub } from "./parse-items";

function parseEmailHeaders(raw: string): { from?: string; subject?: string; body: string } {
  const headerEnd = raw.search(/\r?\n\r?\n/);
  if (headerEnd === -1) {
    return { body: normalizeEmailPaste(raw) };
  }
  const headers = raw.slice(0, headerEnd);
  const body = raw.slice(headerEnd).trim();

  const from = headers.match(/^From:\s*(.+)$/im)?.[1];
  const subject = headers.match(/^Subject:\s*(.+)$/im)?.[1];

  return {
    from: from?.trim(),
    subject: subject?.trim(),
    body: extractTextFromEml(raw) || normalizeEmailPaste(body),
  };
}

function buildOrder(
  items: ReturnType<typeof extractItemsFromText>,
  body: string,
  storeId: StoreId,
  externalPrefix: string,
): ConnectorOrder[] {
  if (items.length === 0) return [];

  return [
    {
      externalId: `${externalPrefix}-${extractDate(body).toISOString().slice(0, 10)}-${Date.now()}`,
      orderedAt: extractDate(body),
      totalRub: extractTotalRub(body),
      items,
    },
  ];
}

export function parseEmailContent(options: {
  raw?: string;
  eml?: string;
  forcedStoreId?: StoreId;
}): ParsedSourceImport {
  const raw = options.eml ?? options.raw ?? "";
  const { from, subject, body } = options.eml
    ? parseEmailHeaders(options.eml)
    : { body: normalizeEmailPaste(raw), from: undefined, subject: undefined };

  const detected = detectFromEmail({ from, subject, body });
  const storeId = (options.forcedStoreId ??
    detected?.storeId ??
    "receipt") as StoreId;
  const storeName = detected?.name ?? "Почта";

  // Сначала OFD/чековый формат
  const receiptOrders = parseReceiptText(body);
  if (receiptOrders.length > 0 && receiptOrders[0].items.length > 0) {
    return {
      storeId: storeId === "receipt" ? "receipt" : storeId,
      storeName,
      channel: "email",
      confidence: detected ? "high" : "medium",
      orders: receiptOrders.map((o) => ({
        ...o,
        externalId: `email-${o.externalId}`,
      })),
    };
  }

  const items = extractItemsFromText(body);
  const orders = buildOrder(items, body, storeId, "email");

  if (orders.length === 0) {
    return {
      storeId,
      storeName,
      channel: "email",
      confidence: "low",
      orders: [],
      warnings: [
        "Не удалось извлечь товары. Скопируйте таблицу из письма или приложите CSV.",
      ],
    };
  }

  return {
    storeId,
    storeName,
    channel: "email",
    confidence: detected ? "high" : "medium",
    orders,
  };
}
