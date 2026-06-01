"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiFetch, ApiError } from "@/lib/api/client";

const FEATURES = [
  "Несколько семейных профилей (локально)",
  "Флаг для AI-фото при своём OPENAI_API_KEY",
  "Приоритет в roadmap интеграций",
  "Расширенная аналитика (скоро)",
];

export default function ProPage() {
  const [plan, setPlan] = useState("free");
  const [message, setMessage] = useState<{ variant: "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ plan: string }>("/api/pro");
      setPlan(data.plan ?? "free");
    } catch {
      /* ignore */
    }
  }, []);

  useOnMount(load);

  async function setPlanAction(action: "activate_trial" | "deactivate") {
    setLoading(true);
    setMessage(null);
    try {
      const data = await apiFetch<{ plan: string; message: string }>("/api/pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setPlan(data.plan);
      setMessage({ variant: "success", text: data.message });
    } catch (e) {
      setMessage({
        variant: "info",
        text: e instanceof ApiError ? e.message : "Ошибка",
      });
    } finally {
      setLoading(false);
    }
  }

  const isPro = plan === "pro";

  return (
    <Screen>
      <PageHeader
        description={
          isPro
            ? "Демо-режим Pro (без оплаты)"
            : "Расширения для теста · всё приложение бесплатно"
        }
      />

      {message && (
        <StatusBanner variant={message.variant}>{message.text}</StatusBanner>
      )}

      <Panel className="mb-4 overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 px-5 py-6 text-white">
          <p className="text-2xl font-bold">Бесплатно</p>
          <p className="text-sm text-sky-100">
            pre-alpha · переключатель в БД, без App Store и без оплаты
          </p>
        </div>
        <div className="p-5">
          <ul className="mb-5 space-y-2.5 text-sm text-slate-700">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          {!isPro ? (
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => void setPlanAction("activate_trial")}
            >
              Включить демо Pro
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-sm font-medium text-emerald-700">
                Pro активен
              </p>
              <Button
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={() => void setPlanAction("deactivate")}
              >
                Вернуться на бесплатный
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <Panel variant="muted" className="text-xs leading-relaxed text-slate-500">
        jFreeze использует только бесплатные инструменты (см. docs/FREE_STACK.md в
        репозитории). OpenAI — опционально, по вашему ключу; без него работают
        эвристика фото и умная корзина без AI-совета.
      </Panel>
    </Screen>
  );
}
