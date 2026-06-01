"use client";

import { useState } from "react";
import { apiFetch, importOrders, refreshCart, ApiError } from "@/lib/api/client";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { StatusBanner } from "./ui/StatusBanner";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDemo() {
    setLoading(true);
    setError(null);
    try {
      await importOrders({ storeId: "demo" });
      await refreshCart();
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
      text: "Загрузим демо-заказы — приложение узнает ваши привычки.",
      action: (
        <Button onClick={() => void loadDemo()} disabled={loading}>
          {loading ? "Загрузка…" : "Загрузить демо-заказы"}
        </Button>
      ),
    },
    {
      title: "Шаг 2: Холодильник",
      text: "На вкладке «Холод» добавьте продукты или сфотографируйте содержимое.",
      action: (
        <Button variant="secondary" onClick={() => setStep(2)}>
          Дальше
        </Button>
      ),
    },
    {
      title: "Шаг 3: Умная корзина",
      text: "Сформируем список покупок с учётом запасов.",
      action: (
        <Button onClick={() => void finish()} disabled={loading}>
          {loading ? "Готово…" : "Завершить"}
        </Button>
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
      <p className="mt-2 text-sm text-slate-600">{current.text}</p>
      {error && (
        <div className="mt-3">
          <StatusBanner variant="error">{error}</StatusBanner>
        </div>
      )}
      <div className="mt-4">{current.action}</div>
    </Card>
  );
}
