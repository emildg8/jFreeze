import type { DetectedItem } from "./vision";

export const DEMO_FRIDGE_ITEMS: DetectedItem[] = [
  { name: "Молоко", qty: 1, unit: "л", confidence: 0.35 },
  { name: "Яйца", qty: 10, unit: "шт", confidence: 0.35 },
  { name: "Сыр", qty: 1, unit: "шт", confidence: 0.3 },
  { name: "Йогурт", qty: 2, unit: "шт", confidence: 0.3 },
];

export const DEMO_FREEZER_ITEMS: DetectedItem[] = [
  { name: "Замороженные овощи", qty: 1, unit: "уп", confidence: 0.35 },
  { name: "Мороженое", qty: 1, unit: "шт", confidence: 0.3 },
  { name: "Пельмени", qty: 1, unit: "уп", confidence: 0.35 },
];

export function getDemoVisionItems(zone: "fridge" | "freezer"): DetectedItem[] {
  return zone === "freezer" ? [...DEMO_FREEZER_ITEMS] : [...DEMO_FRIDGE_ITEMS];
}
