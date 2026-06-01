import { NextResponse } from "next/server";
import {
  generateSmartCartSuggestions,
  listCartSuggestions,
} from "@/lib/services/cart";
import { parseCartPreferences } from "@/lib/cart/preferences";
import { getCartPreferences } from "@/lib/services/settings";

export async function GET() {
  try {
    let suggestions = listCartSuggestions();
    if (suggestions.length === 0) {
      await generateSmartCartSuggestions();
      suggestions = listCartSuggestions();
    }
    const total = suggestions.reduce(
      (s, row) => s + (Number(row.estPriceRub) || 0),
      0,
    );
    return NextResponse.json({
      suggestions,
      preferences: getCartPreferences(),
      estimatedTotal: Math.round(total),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка корзины" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let prefs;
    try {
      const body = await request.json();
      if (body.cartPreferences) {
        prefs = parseCartPreferences(JSON.stringify(body.cartPreferences));
      }
    } catch {
      /* empty body — defaults */
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
      { error: "Не удалось сформировать корзину" },
      { status: 500 },
    );
  }
}
