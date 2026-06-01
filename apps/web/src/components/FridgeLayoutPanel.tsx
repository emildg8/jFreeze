"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Panel } from "./ui/Panel";
import { Section } from "./ui/Section";
import { LoadingBlock } from "./ui/LoadingBlock";
import { Button } from "./ui/Button";
import { apiFetch, ApiError } from "@/lib/api/client";

interface LayoutItem {
  id: string;
  name: string;
  zone: "fridge" | "freezer";
  shelf: string;
  temperature: string;
  tips: string;
  expiryAt?: string | null;
}

interface LayoutPlan {
  fridge: LayoutItem[];
  freezer: LayoutItem[];
  tips: string[];
}

export function FridgeLayoutPanel() {
  const [plan, setPlan] = useState<LayoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LayoutPlan>("/api/fridge/layout");
      setPlan(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useOnMount(load);

  return (
    <Section
      className="mt-2"
      title="Расстановка"
      description="Куда положить продукты по зонам и срокам"
      action={
        <Button variant="ghost" className="py-1 text-xs" onClick={() => void load()}>
          Обновить
        </Button>
      }
    >
      <Panel variant="storage">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {loading && <LoadingBlock label="Строю план…" />}

      {plan && plan.fridge.length + plan.freezer.length === 0 && !loading && (
        <p className="text-xs text-slate-500">Добавьте продукты — появится план раскладки.</p>
      )}

      {plan && plan.tips.length > 0 && (
        <ul className="mb-3 list-inside list-disc space-y-1 text-xs text-slate-600">
          {plan.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}

      {plan && plan.fridge.length > 0 && (
        <LayoutSection title="Холодильник" items={plan.fridge} />
      )}
      {plan && plan.freezer.length > 0 && (
        <LayoutSection title="Морозилка" items={plan.freezer} />
      )}
      </Panel>
    </Section>
  );
}

function LayoutSection({
  title,
  items,
}: {
  title: string;
  items: LayoutItem[];
}) {
  const byShelf = items.reduce<Record<string, LayoutItem[]>>((acc, item) => {
    const key = item.shelf;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="mb-3 last:mb-0">
      <h3 className="mb-2 text-xs font-medium text-emerald-800">{title}</h3>
      {Object.entries(byShelf).map(([shelf, shelfItems]) => (
        <div key={shelf} className="mb-2 rounded-lg bg-white/80 p-2">
          <p className="text-xs font-medium text-slate-700">
            {shelf} · {shelfItems[0]?.temperature}
          </p>
          <ul className="mt-1 space-y-1">
            {shelfItems.map((item) => (
              <li key={item.id} className="text-xs text-slate-600">
                <span className="font-medium">{item.name}</span>
                {item.expiryAt && (
                  <span className="text-slate-400">
                    {" "}
                    · до{" "}
                    {new Date(item.expiryAt).toLocaleDateString("ru-RU")}
                  </span>
                )}
                <span className="block text-[10px] text-slate-400">{item.tips}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
