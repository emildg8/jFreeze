"use client";

import { useState } from "react";
import { apiFetch, importOrders, refreshCart, ApiError } from "@/lib/api/client";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { StatusBanner } from "./ui/StatusBanner";
import { LinkButton } from "./ui/LinkButton";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoaded, setDemoLoaded] = useState(false);

  async function loadDemo() {
    setLoading(true);
    setError(null);
    try {
      await importOrders({ storeId: "demo" });
      await refreshCart();
      setDemoLoaded(true);
      setStep(1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingDone: true }),
      });
      await refreshCart();
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    {
      title: "Шаг 1: История покупок",
      text: demoLoaded
        ? "Демо-заказы загружены. Позже добавьте настоящий чек: QR на кассовом чеке — самый быстрый способ."
        : "Загрузим пример заказов, чтобы корзина и расходы заработали. Или сразу отсканируйте QR чека в разделе «Заказы».",
      action: demoLoaded ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href="/orders" className="flex-1">
            Сканировать настоящий чек
          </LinkButton>
          <Button variant="secondary" onClick={() => setStep(1)}>
            Дальше
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void loadDemo()} disabled={loading}>
            {loading ? "Загрузка…" : "Попробовать на демо"}
          </Button>
          <LinkButton href="/orders" variant="secondary" className="flex-1">
            У меня есть чек
          </LinkButton>
        </div>
      ),
    },
    {
      title: "Шаг 2: Холодильник",
      text: "Отметьте, что уже есть дома — тогда в корзине не будет дубликатов. Можно сфотографировать полки или ввести вручную.",
      action: (
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href="/fridge" className="flex-1">
            Открыть холодильник
          </LinkButton>
          <Button variant="secondary" onClick={() => setStep(2)}>
            Пропустить
          </Button>
        </div>
      ),
    },
    {
      title: "Шаг 3: Умная корзина",
      text: "Соберём список покупок с учётом истории и запасов. Настройте приоритет: цена, качество или здоровье. Позже можно войти в аккаунт — данные с этого устройства сохранятся.",
      action: (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <LinkButton href="/cart" className="flex-1">
              Собрать корзину
            </LinkButton>
            <Button onClick={() => void finish()} disabled={loading}>
              {loading ? "Готово…" : "На главную"}
            </Button>
          </div>
          <LinkButton href="/login?callbackUrl=/" variant="secondary" className="w-full">
            Войти и сохранить на всех устройствах
          </LinkButton>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <Card className="mb-4 border-sky-200 bg-gradient-to-b from-sky-50 to-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
        Добро пожаловать · {step + 1}/3
      </p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">{current.title}</h2>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{current.text}</p>
      {error && (
        <div className="mt-3">
          <StatusBanner variant="error">{error}</StatusBanner>
        </div>
      )}
      <div className="mt-4">{current.action}</div>
    </Card>
  );
}
