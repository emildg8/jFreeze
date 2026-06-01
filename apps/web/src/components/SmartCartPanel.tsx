"use client";

import { useState } from "react";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Chip } from "./ui/Chip";
import type { CartPreferences, CartPriority } from "@/lib/cart/preferences";
import { DEFAULT_CART_PREFERENCES } from "@/lib/cart/preferences";

const PRIORITIES: { id: CartPriority; label: string }[] = [
  { id: "balanced", label: "Баланс" },
  { id: "price", label: "Цена" },
  { id: "quality", label: "Качество" },
  { id: "health", label: "Состав" },
];

interface SmartCartPanelProps {
  initial?: CartPreferences;
  onGenerate: (prefs: CartPreferences) => Promise<void>;
  loading?: boolean;
}

export function SmartCartPanel({
  initial,
  onGenerate,
  loading,
}: SmartCartPanelProps) {
  const [prefs, setPrefs] = useState<CartPreferences>(
    initial ?? DEFAULT_CART_PREFERENCES,
  );

  function update<K extends keyof CartPreferences>(key: K, value: CartPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  return (
    <Panel variant="accent">
      <h2 className="mb-1 text-sm font-semibold text-slate-800">
        Умный подбор корзины
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        История покупок + холодильник · фильтры цена / качество / состав · AI-совет
      </p>

      <p className="mb-2 text-xs font-medium text-slate-600">Приоритет</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {PRIORITIES.map((p) => (
          <Chip
            key={p.id}
            active={prefs.priority === p.id}
            onClick={() => update("priority", p.id)}
          >
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Бюджет, ₽</label>
          <Input
            type="number"
            placeholder="Не задан"
            value={prefs.budgetRub ?? ""}
            onChange={(e) =>
              update(
                "budgetRub",
                e.target.value ? parseFloat(e.target.value) : null,
              )
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Макс. позиций</label>
          <Input
            type="number"
            min={5}
            max={50}
            value={prefs.maxItems}
            onChange={(e) =>
              update("maxItems", parseInt(e.target.value, 10) || 25)
            }
          />
        </div>
      </div>

      <label className="mb-2 block text-xs text-slate-500">
        Ограничения по питанию / аллергии
      </label>
      <Input
        className="mb-3"
        placeholder="Например: без лактозы, меньше сахара"
        value={prefs.dietaryNotes}
        onChange={(e) => update("dietaryNotes", e.target.value)}
      />

      <div className="mb-3 space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.excludeBakery}
            onChange={(e) => update("excludeBakery", e.target.checked)}
            className="rounded border-slate-300"
          />
          Без бакалеи и выпечки (крупы, хлеб — вручную)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.preferSimpleComposition}
            onChange={(e) => update("preferSimpleComposition", e.target.checked)}
            className="rounded border-slate-300"
          />
          Проще состав (отсечь «сладкое/жирное»)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.useAiAdvisor}
            onChange={(e) => update("useAiAdvisor", e.target.checked)}
            className="rounded border-slate-300"
          />
          AI-совет (опционально, свой ключ OpenAI — платный у провайдера)
        </label>
      </div>

      <Button className="w-full" disabled={loading} onClick={() => void onGenerate(prefs)}>
        {loading ? "Собираю корзину…" : "Собрать умную корзину"}
      </Button>
    </Panel>
  );
}
