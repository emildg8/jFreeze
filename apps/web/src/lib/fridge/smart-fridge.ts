import type { DetectedItem, FridgeVisionProvider } from "./vision";
import type { FridgeVisionContext } from "./fridge-model";

/** Заглушка Home Assistant / MQTT: GET inventory JSON с умного холодильника */
export class SmartFridgeProvider implements FridgeVisionProvider {
  readonly mode = "ai" as const;

  constructor(
    private baseUrl: string,
    private token?: string,
  ) {}

  async detectFromImage(
    _buffer: Buffer,
    zone: "fridge" | "freezer",
    _context: FridgeVisionContext,
  ): Promise<DetectedItem[]> {
    const url = new URL("/api/jfreeze/inventory", this.baseUrl.replace(/\/$/, ""));
    url.searchParams.set("zone", zone);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`Умный холодильник: ${res.status}`);
    }

    const data = (await res.json()) as {
      items?: Array<{ name: string; qty?: number; unit?: string }>;
    };

    return (data.items ?? []).map((item) => ({
      name: item.name,
      qty: item.qty ?? 1,
      unit: item.unit ?? "шт",
      confidence: 0.95,
    }));
  }
}

export function createSmartFridgeProvider(
  url: string | null | undefined,
  token: string | null | undefined,
): SmartFridgeProvider | null {
  if (!url?.trim()) return null;
  return new SmartFridgeProvider(url.trim(), token?.trim());
}
