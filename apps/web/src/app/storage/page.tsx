"use client";

import { useMemo, useState } from "react";
import { Screen } from "@/components/ui/Screen";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import guide from "@/data/storage-guide.ru.json";

type GuideItem = (typeof guide)[number];

export default function StoragePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set(guide.map((g) => g.category));
    return ["all", ...set];
  }, []);

  const filtered = useMemo(() => {
    return guide.filter((item: GuideItem) => {
      const matchCat = category === "all" || item.category === category;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.tips.toLowerCase().includes(q) ||
        item.category.includes(q);
      return matchCat && matchQuery;
    });
  }, [query, category]);

  return (
    <Screen>
      <PageHeader description="Температура, полка и срок хранения продуктов" />

      <Input
        className="mb-3"
        placeholder="Поиск: молоко, мясо…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Chip
            key={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
          >
            {cat === "all" ? "Все" : cat}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState title="Ничего не найдено" description="Измените запрос или категорию" />
      )}

      <ul className="space-y-3">
        {filtered.map((item) => (
          <li key={item.id}>
            <Panel>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{item.name}</h2>
                <span className="shrink-0 text-xs text-slate-400">{item.category}</span>
              </div>
              <dl className="mt-2 space-y-1 text-sm text-slate-600">
                <div>
                  <dt className="inline font-medium text-slate-700">Температура: </dt>
                  <dd className="inline">{item.temperature}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-700">Полка: </dt>
                  <dd className="inline">{item.shelf}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-700">Срок: </dt>
                  <dd className="inline">до {item.shelfLifeDays} дн.</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm text-slate-700">{item.tips}</p>
              {item.neighbors !== "—" && (
                <p className="mt-1 text-xs text-slate-500">Соседи: {item.neighbors}</p>
              )}
            </Panel>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
