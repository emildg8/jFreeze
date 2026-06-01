import type { DetectedItem, FridgeVisionProvider } from "./vision";
import type { FridgeVisionContext } from "./fridge-model";

function detectMime(buffer: Buffer): string {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "image/gif";
  return "image/jpeg";
}

export class OpenAIVisionProvider implements FridgeVisionProvider {
  readonly mode = "ai" as const;

  constructor(private apiKey: string) {}

  async detectFromImage(
    buffer: Buffer,
    zone: "fridge" | "freezer",
    context: FridgeVisionContext,
  ): Promise<DetectedItem[]> {
    const base64 = buffer.toString("base64");
    const mime = detectMime(buffer);
    const zoneLabel = zone === "freezer" ? "морозилки" : "холодильника";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `На фото ${zoneLabel}. ${context.promptExtra}
Перечисли только явно видимые продукты (упаковки, банки, овощи). Ответь ТОЛЬКО JSON-массивом:
[{"name":"название на русском","qty":1,"unit":"шт|л|кг|уп","confidence":0.0-1.0}]
Без markdown и комментариев. Не угадывай скрытое. Если пусто или неразборчиво — [].`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI Vision: ${res.status} ${errText.slice(0, 120)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let parsed: Array<{
      name: string;
      qty?: number;
      unit?: string;
      confidence?: number;
    }> = [];
    try {
      parsed = JSON.parse(jsonMatch?.[0] ?? "[]") as typeof parsed;
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item.name?.trim())
      .map((item) => ({
        name: item.name.trim(),
        qty: item.qty ?? 1,
        unit: item.unit ?? "шт",
        confidence: Math.min(1, Math.max(0, item.confidence ?? 0.75)),
      }));
  }
}
