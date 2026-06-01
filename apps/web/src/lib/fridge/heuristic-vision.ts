import type { DetectedItem, FridgeVisionProvider } from "./vision";
import type { FridgeVisionContext } from "./fridge-model";

/** Без ключа OpenAI не подставляем фиктивные продукты — только пустой список. */
export class HeuristicVisionProvider implements FridgeVisionProvider {
  readonly mode = "demo" as const;

  async detectFromImage(
    ..._args: [Buffer, "fridge" | "freezer", FridgeVisionContext]
  ): Promise<DetectedItem[]> {
    void _args;
    return [];
  }
}
