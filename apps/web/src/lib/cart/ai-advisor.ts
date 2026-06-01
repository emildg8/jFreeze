import { resolveOpenAiApiKey } from "@/lib/services/settings";
import type { SmartCartItem } from "./smart-engine";
import type { CartPreferences } from "./preferences";
import type { InventorySnapshot } from "./engine";

export interface AiAdvisorInput {
  items: SmartCartItem[];
  inventory: InventorySnapshot[];
  prefs: CartPreferences;
  dietaryNotes: string;
}

export interface AiAdvisorResult {
  summary: string;
  tips: string[];
  adjustedItems?: Array<{
    normalizedName: string;
    note: string;
  }>;
}

export async function runAiCartAdvisor(
  input: AiAdvisorInput,
): Promise<AiAdvisorResult | null> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey || !input.prefs.useAiAdvisor) return null;

  const cartLines = input.items
    .slice(0, 20)
    .map(
      (i) =>
        `- ${i.name} x${i.suggestedQty} (${i.category}, ~${i.estPriceRub}₽): ${i.compositionTip}`,
    )
    .join("\n");

  const fridgeLines = input.inventory
    .slice(0, 15)
    .map((i) => `- ${i.name} ${i.qty} ${i.unit} (${i.zone})`)
    .join("\n");

  const prompt = `Ты помощник по покупкам продуктов в России. Проанализируй корзину и холодильник.
Приоритет: ${input.prefs.priority}. Бюджет: ${input.prefs.budgetRub ?? "не задан"} ₽.
Заметки пользователя: ${input.dietaryNotes || "нет"}.
Бакалея ${input.prefs.excludeBakery ? "исключена" : "может быть"}.

Корзина:
${cartLines || "(пусто)"}

В холодильнике:
${fridgeLines || "(пусто)"}

Ответь JSON:
{"summary":"2-3 предложения","tips":["совет1","совет2","совет3"],"adjustedItems":[{"normalizedName":"...","note":"кратко"}]}
Только JSON.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as AiAdvisorResult;
  } catch {
    return null;
  }
}
