import { resolveOpenAiApiKey } from "@/lib/services/settings";
import { OpenAIVisionProvider } from "./openai-vision";

export interface DetectedItem {
  name: string;
  qty: number;
  unit: string;
  confidence: number;
}

export interface FridgeVisionProvider {
  detectFromImage(buffer: Buffer, zone: "fridge" | "freezer"): Promise<DetectedItem[]>;
}

const HEURISTIC_FRIDGE: DetectedItem[] = [
  { name: "Молоко", qty: 1, unit: "л", confidence: 0.5 },
  { name: "Яйца", qty: 10, unit: "шт", confidence: 0.5 },
  { name: "Сыр", qty: 1, unit: "шт", confidence: 0.4 },
  { name: "Йогурт", qty: 2, unit: "шт", confidence: 0.4 },
];

export class HeuristicVisionProvider implements FridgeVisionProvider {
  async detectFromImage(
    _buffer: Buffer,
    zone: "fridge" | "freezer",
  ): Promise<DetectedItem[]> {
    if (zone === "freezer") {
      return [
        { name: "Замороженные овощи", qty: 1, unit: "уп", confidence: 0.4 },
        { name: "Мороженое", qty: 1, unit: "шт", confidence: 0.3 },
        { name: "Пельмени", qty: 1, unit: "уп", confidence: 0.4 },
      ];
    }
    return [...HEURISTIC_FRIDGE];
  }
}

/** Только для загрузки фото — не умный холодильник (он через /api/smart-fridge/sync). */
export function getVisionProvider(): FridgeVisionProvider {
  const apiKey = resolveOpenAiApiKey();
  if (apiKey) {
    return new OpenAIVisionProvider(apiKey);
  }
  return new HeuristicVisionProvider();
}
