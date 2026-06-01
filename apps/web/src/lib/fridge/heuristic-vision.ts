import type { DetectedItem, FridgeVisionProvider } from "./vision";
import type { FridgeVisionContext } from "./fridge-model";

const DEMO_FRIDGE: DetectedItem[] = [
  { name: "Молоко", qty: 1, unit: "л", confidence: 0.35 },
  { name: "Яйца", qty: 10, unit: "шт", confidence: 0.35 },
  { name: "Сыр", qty: 1, unit: "шт", confidence: 0.3 },
  { name: "Йогурт", qty: 2, unit: "шт", confidence: 0.3 },
];

const DEMO_FREEZER: DetectedItem[] = [
  { name: "Замороженные овощи", qty: 1, unit: "уп", confidence: 0.35 },
  { name: "Мороженое", qty: 1, unit: "шт", confidence: 0.3 },
  { name: "Пельмени", qty: 1, unit: "уп", confidence: 0.35 },
];

/** Демо-подсказка без ключа OpenAI — список для правки вручную. */
export class HeuristicVisionProvider implements FridgeVisionProvider {
  readonly mode = "demo" as const;

  async detectFromImage(
    _buffer: Buffer,
    zone: "fridge" | "freezer",
    context: FridgeVisionContext,
  ): Promise<DetectedItem[]> {
    void context.model.label;
    if (zone === "freezer") return [...DEMO_FREEZER];
    return [...DEMO_FRIDGE];
  }
}
