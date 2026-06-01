export type CartPriority = "balanced" | "price" | "quality" | "health";

export interface CartPreferences {
  priority: CartPriority;
  budgetRub: number | null;
  maxItems: number;
  excludeBakery: boolean;
  excludeCategories: string[];
  dietaryNotes: string;
  preferSimpleComposition: boolean;
  useAiAdvisor: boolean;
}

export const DEFAULT_CART_PREFERENCES: CartPreferences = {
  priority: "balanced",
  budgetRub: null,
  maxItems: 25,
  excludeBakery: false,
  excludeCategories: [],
  dietaryNotes: "",
  preferSimpleComposition: false,
  useAiAdvisor: true,
};

export function parseCartPreferences(json: string | null | undefined): CartPreferences {
  if (!json) return { ...DEFAULT_CART_PREFERENCES };
  try {
    const parsed = JSON.parse(json) as Partial<CartPreferences>;
    return {
      ...DEFAULT_CART_PREFERENCES,
      ...parsed,
      excludeCategories: parsed.excludeCategories ?? [],
    };
  } catch {
    return { ...DEFAULT_CART_PREFERENCES };
  }
}
