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
  "AI-распознавание фото (серверный ключ или свой)",
  "Несколько семейных профилей",
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
          isPro ? "Активна подписка Pro" : "Расширенные возможности приложения"
        }
      />

      {message && (
        <StatusBanner variant={message.variant}>{message.text}</StatusBanner>
      )}

      <Panel className="mb-4 overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 px-5 py-6 text-white">
          <p className="text-3xl font-bold tabular-nums">199 ₽</p>
          <p className="text-sm text-sky-100">в месяц · демо бесплатно</p>
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
              Попробовать Pro
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
        Оплата через App Store / Google Play — после публикации мобильной сборки
        (Capacitor). На сервере задайте OPENAI_API_KEY для AI без личного ключа.
      </Panel>
    </Screen>
  );
}
