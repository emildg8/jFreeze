import hints from "@/data/product-hints.ru.json";
import { normalizeProductName } from "@/lib/orders/normalize";

export interface ProductHint {
  category: string;
  compositionTip: string;
  qualityTip: string;
  priceTier: "low" | "medium" | "high";
  healthScore: number;
}

const HINTS = hints as Record<string, ProductHint>;

const CATEGORY_KEYWORDS: Array<{ category: string; words: string[] }> = [
  { category: "молочные", words: ["молоко", "сыр", "йогурт", "творог", "кефир", "масло", "яйц"] },
  { category: "мясо", words: ["куриц", "мясо", "фарш", "индейк", "говядин", "рыба", "лосос"] },
  { category: "овощи", words: ["помидор", "огурц", "морков", "капуст", "лук", "перец", "овощ"] },
  { category: "фрукты", words: ["яблок", "банан", "апельсин", "ягод", "фрукт"] },
  { category: "выпечка", words: ["хлеб", "батон", "булк", "лаваш", "выпеч"] },
  { category: "бакалея", words: ["греч", "рис", "макарон", "крупа", "мука", "сахар", "чай", "кофе"] },
  { category: "заморозка", words: ["заморож", "морожен", "пельмен", "полуфабрик"] },
];

export function inferCategory(normalizedName: string): string {
  const hint = getProductHint(normalizedName);
  if (hint) return hint.category;

  for (const { category, words } of CATEGORY_KEYWORDS) {
    if (words.some((w) => normalizedName.includes(w))) return category;
  }
  return "прочее";
}

export function getProductHint(normalizedName: string): ProductHint | null {
  const key = normalizeProductName(normalizedName);
  if (HINTS[key]) return HINTS[key];
  for (const [hintKey, hint] of Object.entries(HINTS)) {
    if (key.includes(hintKey) || hintKey.includes(key)) return hint;
  }
  return null;
}

const PRICE_TIER_RUB: Record<string, number> = {
  low: 80,
  medium: 180,
  high: 350,
};

export function estimatePriceRub(normalizedName: string, historyAvg?: number): number {
  if (historyAvg && historyAvg > 0) return Math.round(historyAvg);
  const hint = getProductHint(normalizedName);
  if (hint) return PRICE_TIER_RUB[hint.priceTier] ?? 150;
  return 120;
}

export function scoreProduct(
  normalizedName: string,
  priority: import("./preferences").CartPriority,
): number {
  const hint = getProductHint(normalizedName);
  const health = hint?.healthScore ?? 5;
  const tier = hint?.priceTier ?? "medium";

  switch (priority) {
    case "health":
      return health * 10;
    case "price":
      return tier === "low" ? 90 : tier === "medium" ? 50 : 20;
    case "quality":
      return (hint ? 70 : 40) + health * 2;
    default:
      return health * 5 + (tier === "low" ? 30 : 20);
  }
}
