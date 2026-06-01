import type { ConnectorOrder } from "@/connectors/types";
import type { StoreId } from "@/connectors/types";
import { detectFromSms } from "./detect";
import type { ParsedSourceImport } from "./types";
import { extractDate, extractItemsFromText, extractTotalRub } from "./parse-items";

/** Одно SMS или несколько через пустую строку / --- */
export function parseSmsBatch(
  text: string,
  forcedStoreId?: StoreId,
): ParsedSourceImport[] {
  const chunks = text
    .split(/(?:\n\s*\n|^---+$)/m)
    .map((c) => c.trim())
    .filter((c) => c.length > 8);

  if (chunks.length === 0 && text.trim()) {
    chunks.push(text.trim());
  }

  return chunks.map((chunk, i) => parseSingleSms(chunk, forcedStoreId, i));
}

function parseSingleSms(
  sms: string,
  forcedStoreId?: StoreId,
  index = 0,
): ParsedSourceImport {
  const detected = detectFromSms(sms);
  const storeId = (forcedStoreId ?? detected?.storeId ?? "receipt") as StoreId;
  const storeName = detected?.name ?? "SMS";

  const totalRub = extractTotalRub(sms);
  const date = extractDate(sms);

  // SMS часто без списка товаров — одна покупка
  let items = extractItemsFromText(sms);

  if (items.length === 0 && totalRub) {
    const merchant = extractMerchantName(sms);
    items = [
      {
        name: merchant || "Покупка по SMS",
        qty: 1,
        unit: "шт",
      },
    ];
  }

  const orders: ConnectorOrder[] =
    items.length > 0
      ? [
          {
            externalId: `sms-${storeId}-${date.toISOString().slice(0, 10)}-${index}-${Date.now()}`,
            orderedAt: date,
            totalRub,
            items,
          },
        ]
      : [];

  return {
    storeId,
    storeName,
    channel: "sms",
    confidence: detected ? "high" : totalRub ? "medium" : "low",
    orders,
    warnings:
      orders.length === 0
        ? ["Не удалось разобрать SMS. Проверьте текст банка или магазина."]
        : items.length === 1 && !extractItemsFromText(sms).length
          ? ["Сохранена сумма покупки без детализации товаров."]
          : undefined,
  };
}

function extractMerchantName(sms: string): string | null {
  const patterns = [
    /покупка\s+\d+(?:[.,]\d+)?\s*(?:₽|р\.?|руб\.?)\s+(.+?)(?:\s+баланс|$)/i,
    /списание\s+\d+(?:[.,]\d+)?\s*(?:₽|р\.?|руб\.?)\s+(.+?)(?:\s+баланс|$)/i,
    /(?:mir|мир)-\d+[^а-яё]*покупка\s+\d+(?:[.,]\d+)?\s*(?:₽|р\.?|руб\.?)\s+(.+?)(?:\s+баланс|$)/i,
    /ozon[:\s]+/i,
    /самокат/i,
  ];

  const m = sms.match(
    /покупка\s+\d+(?:[.,]\d+)?\s*(?:₽|р\.?|руб\.?)\s+([A-ZА-ЯЁ0-9][A-ZА-ЯЁ0-9\s.-]{2,40})/i,
  );
  if (m) return m[1].trim();

  for (const p of patterns) {
    if (p.test(sms)) {
      const hit = sms.match(/([A-ZА-ЯЁ][A-ZА-ЯЁ0-9\s.-]{3,30})/);
      if (hit) return hit[1].trim();
    }
  }
  return null;
}
