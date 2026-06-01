"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { Panel } from "@/components/ui/Panel";
import { ActionBar } from "@/components/ui/ActionBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ShareCart } from "@/components/ShareCart";
import { SmartCartPanel } from "@/components/SmartCartPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiFetch, ApiError } from "@/lib/api/client";
import { formatCartList } from "@/lib/share/cart-share";
import type { CartPreferences } from "@/lib/cart/preferences";
import { DEFAULT_CART_PREFERENCES } from "@/lib/cart/preferences";

interface Suggestion {
  id: string;
  name: string;
  suggestedQty: number;
  unit: string | null;
  reason: string;
  category?: string | null;
  score?: number | null;
  estPriceRub?: number | null;
  compositionTip?: string | null;
  qualityTip?: string | null;
}

interface AiAdvice {
  summary: string;
  tips: string[];
  adjustedItems?: Array<{ normalizedName: string; note: string }>;
}

export default function CartPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [prefs, setPrefs] = useState<CartPreferences>(DEFAULT_CART_PREFERENCES);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{
        suggestions: Suggestion[];
        preferences?: CartPreferences;
        estimatedTotal?: number;
      }>("/api/cart");
      setSuggestions(data.suggestions ?? []);
      if (data.preferences) setPrefs(data.preferences);
      setEstimatedTotal(data.estimatedTotal ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  async function generateSmart(nextPrefs: CartPreferences) {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<{
        suggestions: Suggestion[];
        estimatedTotal?: number;
        aiAdvice?: AiAdvice | null;
        preferences?: CartPreferences;
      }>("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartPreferences: nextPrefs }),
      });
      setSuggestions(data.suggestions ?? []);
      setEstimatedTotal(data.estimatedTotal ?? null);
      setAiAdvice(data.aiAdvice ?? null);
      if (data.preferences) setPrefs(data.preferences);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось собрать корзину");
    } finally {
      setGenerating(false);
    }
  }

  async function markBought() {
    if (suggestions.length === 0) return;
    setAccepting(true);
    setError(null);
    try {
      const data = await apiFetch<{
        accepted: number;
        suggestions: Suggestion[];
        estimatedTotal?: number;
      }>("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", ids: "all" }),
      });
      setSuggestions(data.suggestions ?? []);
      setEstimatedTotal(data.estimatedTotal ?? null);
      setAiAdvice(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось отметить");
    } finally {
      setAccepting(false);
    }
  }

  async function copyList() {
    const text = formatCartList(suggestions);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useOnMount(async () => {
    try {
      const settings = await apiFetch<{ cartPreferences?: CartPreferences }>(
        "/api/settings",
      );
      if (settings.cartPreferences) setPrefs(settings.cartPreferences);
    } catch {
      /* defaults */
    }
    await load();
  });

  return (
    <Screen>
      <PageHeader
        title="Умная корзина"
        description="Подбор по цене, качеству и составу · история и холодильник"
      />

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <div className="pb-36">
        <SmartCartPanel
          initial={prefs}
          loading={generating}
          onGenerate={generateSmart}
        />
      </div>

      <div className="fixed inset-x-0 z-[45] border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg flex-col gap-2 md:max-w-2xl lg:max-w-3xl">
          <Button
            className="w-full"
            disabled={generating}
            onClick={() => void generateSmart(prefs)}
          >
            {generating ? "Собираю корзину…" : "Собрать умную корзину"}
          </Button>
          {suggestions.length > 0 && (
            <Button
              variant="secondary"
              className="w-full"
              disabled={accepting || generating}
              onClick={() => void markBought()}
            >
              {accepting ? "Обновляю запасы…" : "Купил — в холодильник"}
            </Button>
          )}
        </div>
      </div>

      {estimatedTotal != null && estimatedTotal > 0 && (
        <p className="mb-3 text-sm text-slate-600">
          Ориентировочно:{" "}
          <span className="font-semibold text-sky-700 tabular-nums">
            ~{estimatedTotal} ₽
          </span>
        </p>
      )}

      {aiAdvice && (
        <Panel variant="ai">
          <h2 className="mb-1 text-sm font-semibold text-violet-900">AI-совет</h2>
          <p className="mb-2 text-sm text-slate-700">{aiAdvice.summary}</p>
          {aiAdvice.tips.length > 0 && (
            <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
              {aiAdvice.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <ActionBar>
        <Button
          variant="secondary"
          className="flex-1 min-w-[120px]"
          disabled={loading || generating}
          onClick={() => void load()}
        >
          {loading ? "…" : "Обновить список"}
        </Button>
        {suggestions.length > 0 && (
          <Button variant="secondary" onClick={() => void copyList()}>
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        )}
      </ActionBar>

      {suggestions.length > 0 && <ShareCart items={suggestions} />}

      {loading && !generating && <LoadingBlock />}

      {!loading && !generating && suggestions.length === 0 && (
        <EmptyState
          title="Корзина пуста"
          description="Нужна история заказов и хотя бы несколько продуктов в холодильнике. Затем нажмите «Собрать умную корзину» выше."
          action={
            <div className="flex flex-col gap-2">
              <LinkButton href="/orders">Добавить чек или заказы</LinkButton>
              <LinkButton href="/fridge" variant="secondary">
                Заполнить холодильник
              </LinkButton>
            </div>
          }
        />
      )}

      <Section title="Список покупок">
      <ul className="space-y-3">
        {suggestions.map((s) => (
          <li key={s.id}>
            <Card>
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium">{s.name}</span>
                  {s.category && (
                    <span className="ml-2 text-xs text-slate-400">{s.category}</span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-semibold text-sky-600 tabular-nums">
                    {s.suggestedQty} {s.unit}
                  </span>
                  {s.estPriceRub != null && s.estPriceRub > 0 && (
                    <p className="text-xs text-slate-500 tabular-nums">
                      ~{Math.round(s.estPriceRub)} ₽
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.reason}</p>
              {(s.compositionTip || s.qualityTip) && (
                <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                  {s.compositionTip && (
                    <p>
                      <span className="font-medium text-slate-700">Состав:</span>{" "}
                      {s.compositionTip}
                    </p>
                  )}
                  {s.qualityTip && (
                    <p>
                      <span className="font-medium text-slate-700">Качество:</span>{" "}
                      {s.qualityTip}
                    </p>
                  )}
                </div>
              )}
              {s.score != null && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Релевантность: {Math.round(s.score)}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
      </Section>
    </Screen>
  );
}
