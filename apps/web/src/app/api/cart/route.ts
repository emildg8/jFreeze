import { NextResponse } from "next/server";
import {
  generateSmartCartSuggestions,
  listCartSuggestions,
  acceptCartSuggestions,
} from "@/lib/services/cart";
import { parseCartPreferences } from "@/lib/cart/preferences";
import { getCartPreferences } from "@/lib/services/settings";
import { resolveUserScope } from "@/lib/auth/scope";

export async function GET() {
  try {
    const userId = await resolveUserScope();
    let suggestions = listCartSuggestions(userId);
    if (suggestions.length === 0) {
      await generateSmartCartSuggestions(undefined);
      suggestions = listCartSuggestions(userId);
    }
    const total = suggestions.reduce(
      (s, row) => s + (Number(row.estPriceRub) || 0),
      0,
    );
    return NextResponse.json({
      suggestions,
      preferences: getCartPreferences(userId),
      estimatedTotal: Math.round(total),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка корзины" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserScope();
    const body = await request.json().catch(() => ({}));

    if (body.action === "accept") {
      const ids = body.ids as string[] | "all" | undefined;
      const result = await acceptCartSuggestions(ids ?? "all", userId);
      const suggestions = listCartSuggestions(userId);
      return NextResponse.json({
        ...result,
        suggestions,
        estimatedTotal: Math.round(
          suggestions.reduce((s, row) => s + (Number(row.estPriceRub) || 0), 0),
        ),
      });
    }

    let prefs;
    if (body.cartPreferences) {
      prefs = parseCartPreferences(JSON.stringify(body.cartPreferences));
    }

    const result = await generateSmartCartSuggestions(prefs);
    return NextResponse.json({
      suggestions: result.suggestions,
      estimatedTotal: result.estimatedTotal,
      aiAdvice: result.aiAdvice,
      preferences: result.preferences,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Не удалось обработать корзину" },
      { status: 500 },
    );
  }
}
