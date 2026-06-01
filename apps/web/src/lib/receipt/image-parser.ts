import { resolveOpenAiApiKey } from "@/lib/services/settings";
import type { ConnectorOrder, ConnectorOrderItem } from "@/connectors/types";

export async function parseReceiptImage(
  buffer: Buffer,
  mime: string,
): Promise<ConnectorOrder[]> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new Error(
      "Для фото чека нужен ключ OpenAI в настройках (опционально) или загрузите CSV / PDF / текст из письма.",
    );
  }

  const base64 = buffer.toString("base64");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
              text: `Это фото кассового чека (Россия). Извлеки позиции покупки.
Ответь ТОЛЬКО JSON:
{"orderedAt":"YYYY-MM-DD","totalRub":123.45,"items":[{"name":"...","qty":1,"unit":"шт"}]}
Без пояснений. Дата — с чека или сегодня. Пропусти сдачу, НДС, итог как отдельные товары.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI: не удалось прочитать чек (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Не удалось распознать позиции на фото чека");
  }

  const parsed = JSON.parse(match[0]) as {
    orderedAt?: string;
    totalRub?: number;
    items?: Array<{ name: string; qty?: number; unit?: string }>;
  };

  const items: ConnectorOrderItem[] = (parsed.items ?? [])
    .filter((i) => i.name?.trim())
    .map((i) => ({
      name: i.name.trim(),
      qty: i.qty ?? 1,
      unit: i.unit ?? "шт",
    }));

  if (items.length === 0) {
    throw new Error("На фото не найдены позиции чека");
  }

  const orderedAt = parsed.orderedAt
    ? new Date(parsed.orderedAt)
    : new Date();

  return [
    {
      externalId: `receipt-photo-${Date.now()}`,
      orderedAt: Number.isNaN(orderedAt.getTime()) ? new Date() : orderedAt,
      totalRub: parsed.totalRub,
      items,
    },
  ];
}
