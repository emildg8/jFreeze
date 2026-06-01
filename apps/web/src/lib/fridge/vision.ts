import { resolveOpenAiApiKeyForUser } from "@/lib/services/settings";
import { OpenAIVisionProvider } from "./openai-vision";
import { HeuristicVisionProvider } from "./heuristic-vision";
import {
  buildFridgeVisionContext,
  type FridgeVisionContext,
} from "./fridge-model";
import { GUEST_USER_ID } from "@/lib/auth/scope";
import { getSettingsForUser } from "@/lib/services/settings";

export interface DetectedItem {
  name: string;
  qty: number;
  unit: string;
  confidence: number;
}

export type FridgeRecognitionMode = "ai" | "demo";

export interface FridgeVisionProvider {
  readonly mode: FridgeRecognitionMode;
  detectFromImage(
    buffer: Buffer,
    zone: "fridge" | "freezer",
    context: FridgeVisionContext,
  ): Promise<DetectedItem[]>;
}

export function getVisionProvider(userId: string = GUEST_USER_ID): FridgeVisionProvider {
  const apiKey = resolveOpenAiApiKeyForUser(userId);
  if (apiKey) {
    return new OpenAIVisionProvider(apiKey);
  }
  return new HeuristicVisionProvider();
}

export function getFridgeVisionContextForUser(
  userId: string = GUEST_USER_ID,
): FridgeVisionContext {
  return buildFridgeVisionContext(getSettingsForUser(userId).fridgeModel);
}
