import type { DetectedItem, FridgeVisionProvider } from "./vision";

export class OpenAIVisionProvider implements FridgeVisionProvider {
  constructor(private apiKey: string) {}

  async detectFromImage(
    buffer: Buffer,
    zone: "fridge" | "freezer",
  ): Promise<DetectedItem[]> {
    const base64 = buffer.toString("base64");
    const mime = "image/jpeg";

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
                text: `Перечисли продукты на фото ${zone === "freezer" ? "морозилки" : "холодильника"}. Ответь только JSON-массивом: [{"name":"...","qty":1,"unit":"шт"}]. На русском.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI: ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "[]") as Array<{
      name: string;
      qty?: number;
      unit?: string;
    }>;

    return parsed.map((item) => ({
      name: item.name,
      qty: item.qty ?? 1,
      unit: item.unit ?? "шт",
      confidence: 0.85,
    }));
  }
}
