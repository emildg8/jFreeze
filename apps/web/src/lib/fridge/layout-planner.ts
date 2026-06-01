import storageGuide from "@/data/storage-guide.ru.json";
import { normalizeProductName } from "@/lib/orders/normalize";
import { inferCategory, getProductHint } from "@/lib/cart/product-knowledge";

export interface LayoutItem {
  id: string;
  name: string;
  zone: "fridge" | "freezer";
  shelf: string;
  temperature: string;
  tips: string;
  expiryAt?: Date | null;
  urgency?: string;
}

type GuideEntry = (typeof storageGuide)[number];

function matchGuide(normalizedName: string): GuideEntry | null {
  const key = normalizeProductName(normalizedName);
  const direct = storageGuide.find(
    (g) => normalizeProductName(g.name) === key || key.includes(normalizeProductName(g.name)),
  );
  if (direct) return direct;

  const hint = getProductHint(key);
  if (!hint) return null;

  return (
    storageGuide.find((g) => g.category === hint.category) ?? null
  );
}

export function planFridgeLayout(
  items: Array<{
    id: string;
    name: string;
    normalizedName: string;
    zone: string;
    expiryAt?: Date | null;
  }>,
): { fridge: LayoutItem[]; freezer: LayoutItem[]; tips: string[] } {
  const fridge: LayoutItem[] = [];
  const freezer: LayoutItem[] = [];
  const tips = new Set<string>();

  tips.add("Сырое мясо и рыба — на нижней полке, готовое — выше.");
  tips.add("Не ставьте молочное в дверцу надолго — там теплее.");

  for (const item of items) {
    const guide = matchGuide(item.normalizedName);
    const zone = item.zone === "freezer" ? "freezer" : "fridge";
    const category = inferCategory(item.normalizedName);

    let shelf = guide?.shelf ?? (zone === "freezer" ? "Морозилка" : "Средняя полка");
    const temperature = guide?.temperature ?? (zone === "freezer" ? "−18°C" : "2–4°C");
    const tipText = guide?.tips ?? "Проверьте срок на упаковке.";

    if (category === "мясо" && zone === "fridge") {
      shelf = "Нижняя полка (отдельно)";
      tips.add("Мясо храните отдельно от готовых блюд.");
    }

    const layout: LayoutItem = {
      id: item.id,
      name: item.name,
      zone,
      shelf,
      temperature,
      tips: tipText,
      expiryAt: item.expiryAt,
    };

    if (zone === "freezer") freezer.push(layout);
    else fridge.push(layout);
  }

  const sortByShelf = (a: LayoutItem, b: LayoutItem) =>
    a.shelf.localeCompare(b.shelf, "ru");

  return {
    fridge: fridge.sort(sortByShelf),
    freezer: freezer.sort(sortByShelf),
    tips: [...tips],
  };
}
