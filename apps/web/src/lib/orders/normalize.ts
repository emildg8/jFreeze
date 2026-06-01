import synonyms from "@/data/synonyms.ru.json";

const SYNONYM_MAP = buildSynonymMap(synonyms as Record<string, string[]>);

function buildSynonymMap(data: Record<string, string[]>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [canonical, variants] of Object.entries(data)) {
    map.set(canonical, canonical);
    for (const v of variants) {
      map.set(normalizeRaw(v), canonical);
    }
  }
  return map;
}

function normalizeRaw(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[«»"']/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\d+([.,]\d+)?\s*(г|гр|кг|мл|л|шт|уп|пак)\b/gi, "")
    .replace(
      /\b(пр|ооо|ао|упак|вкусн|свеж|натур|классик|премиум|оригинал)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeProductName(name: string): string {
  const raw = normalizeRaw(name);
  if (SYNONYM_MAP.has(raw)) {
    return SYNONYM_MAP.get(raw)!;
  }
  for (const [key, canonical] of SYNONYM_MAP) {
    if (raw.includes(key) || key.includes(raw)) {
      return canonical;
    }
  }
  const firstWord = raw.split(" ")[0];
  if (firstWord && SYNONYM_MAP.has(firstWord)) {
    return SYNONYM_MAP.get(firstWord)!;
  }
  return raw;
}

export interface RawOrderInput {
  storeId: string;
  orderedAt: Date;
  externalId?: string;
  totalRub?: number;
  items: Array<{
    name: string;
    qty?: number;
    unit?: string;
    category?: string;
  }>;
}

export interface NormalizedOrderItem {
  name: string;
  normalizedName: string;
  qty: number;
  unit: string;
  category?: string;
}

export function normalizeOrderItems(
  items: RawOrderInput["items"],
): NormalizedOrderItem[] {
  return items.map((item) => ({
    name: item.name.trim(),
    normalizedName: normalizeProductName(item.name),
    qty: item.qty ?? 1,
    unit: item.unit ?? "шт",
    category: item.category,
  }));
}
