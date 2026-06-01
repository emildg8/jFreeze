"use client";

import { Panel } from "./ui/Panel";

export interface CategorySpendRow {
  category: string;
  totalRub: number;
  itemCount: number;
}

interface SpendByCategoryPanelProps {
  totalRub: number;
  byCategory: CategorySpendRow[];
  days?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  молочные: "Молочные",
  мясо: "Мясо и рыба",
  овощи: "Овощи",
  фрукты: "Фрукты",
  выпечка: "Выпечка",
  бакалея: "Бакалея",
  заморозка: "Заморозка",
  прочее: "Прочее",
};

export function SpendByCategoryPanel({
  totalRub,
  byCategory,
  days = 7,
}: SpendByCategoryPanelProps) {
  if (!byCategory.length || totalRub <= 0) return null;

  const max = byCategory[0]?.totalRub ?? 1;
  const top = byCategory[0];
  const topLabel = top ? CATEGORY_LABELS[top.category] ?? top.category : "";
  const topPct = top ? Math.round((top.totalRub / totalRub) * 100) : 0;

  return (
    <Panel className="text-sm">
      <p className="font-medium text-slate-800">Расходы по категориям</p>
      <p className="mb-1 text-xs text-slate-500">
        За {days} дн. · оценка по сумме заказов и позициям
      </p>
      {top && topPct >= 40 && (
        <p className="mb-3 text-xs text-slate-600">
          Больше всего ушло на <strong>{topLabel}</strong> — {topPct}% бюджета.
        </p>
      )}
      {(!top || topPct < 40) && <div className="mb-3" />}
      <ul className="space-y-2.5">
        {byCategory.slice(0, 8).map((row) => {
          const pct = Math.round((row.totalRub / totalRub) * 100);
          const width = Math.max(4, Math.round((row.totalRub / max) * 100));
          const label = CATEGORY_LABELS[row.category] ?? row.category;
          return (
            <li key={row.category}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="tabular-nums text-slate-500">
                  {row.totalRub.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽ · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
