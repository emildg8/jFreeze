"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StoreBadge } from "@/components/StoreBadge";
import { PushEnable } from "@/components/PushEnable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Chip } from "@/components/ui/Chip";
import { CSV_TEMPLATES } from "@/data/csv-templates";
import { apiFetch, importOrders, refreshCart, ApiError } from "@/lib/api/client";

interface Store {
  id: string;
  displayName: string;
  availability: string;
  label?: string;
}

interface PublicSettings {
  minQtyThreshold: number;
  historyDays: number;
  expiryRemindersEnabled: boolean;
  hasOpenAiKey: boolean;
  hasSmartFridgeToken: boolean;
  smartFridgeUrl: string | null;
  plan: string;
}

export default function SettingsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [templateId, setTemplateId] = useState("generic");
  const [csv, setCsv] = useState(CSV_TEMPLATES[0].sample);
  const [threshold, setThreshold] = useState(1);
  const [historyDays, setHistoryDays] = useState(90);
  const [openaiKey, setOpenaiKey] = useState("");
  const [clearOpenAi, setClearOpenAi] = useState(false);
  const [smartUrl, setSmartUrl] = useState("");
  const [smartToken, setSmartToken] = useState("");
  const [expiryOn, setExpiryOn] = useState(true);
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [storesRes, settingsRes] = await Promise.all([
        apiFetch<{ stores: Store[] }>("/api/stores"),
        apiFetch<{ settings: PublicSettings }>("/api/settings"),
      ]);
      setStores(storesRes.stores ?? []);
      const s = settingsRes.settings;
      setThreshold(s.minQtyThreshold ?? 1);
      setHistoryDays(s.historyDays ?? 90);
      setExpiryOn(s.expiryRemindersEnabled !== false);
      setHasOpenAiKey(s.hasOpenAiKey);
      setSmartUrl(s.smartFridgeUrl ?? "");
      setOpenaiKey("");
      setClearOpenAi(false);
      setSmartToken("");
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка загрузки",
      });
    }
  }, []);

  useOnMount(load);

  function applyTemplate(id: string) {
    const t = CSV_TEMPLATES.find((x) => x.id === id);
    if (t) {
      setTemplateId(id);
      setCsv(t.sample);
    }
  }

  async function storeAction(storeId: string, availability: string) {
    setMessage(null);
    try {
      if (availability === "beta" || availability === "planned") {
        applyTemplate(storeId === "ozon" ? "ozon" : storeId === "pyaterochka" ? "pyaterochka" : "generic");
        setMessage({
          variant: "success",
          text: "Выберите шаблон ниже и нажмите «Импортировать»",
        });
        return;
      }
      const data = await apiFetch<{ message?: string; imported?: number }>("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action: "sync" }),
      });
      await refreshCart();
      setMessage({
        variant: "success",
        text: data.message ?? `Импортировано: ${data.imported ?? 0}`,
      });
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка",
      });
    }
  }

  async function importCsv() {
    setMessage(null);
    try {
      const result = await importOrders({
        storeId: templateId === "ozon" ? "ozon" : "csv",
        csv,
        templateId,
      });
      await refreshCart();
      setMessage({
        variant: "success",
        text: `Импортировано заказов: ${result.imported}`,
      });
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка импорта",
      });
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        minQtyThreshold: threshold,
        historyDays,
        expiryRemindersEnabled: expiryOn,
        smartFridgeUrl: smartUrl || null,
      };
      if (clearOpenAi) body.openaiApiKey = null;
      else if (openaiKey.trim()) body.openaiApiKey = openaiKey.trim();
      if (smartToken.trim()) body.smartFridgeToken = smartToken.trim();

      await apiFetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await load();
      setMessage({ variant: "success", text: "Настройки сохранены" });
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка сохранения",
      });
    } finally {
      setSaving(false);
    }
  }

  async function syncSmartFridge() {
    setMessage(null);
    try {
      const data = await apiFetch<{ imported?: number; error?: string }>(
        "/api/smart-fridge/sync",
        { method: "POST" },
      );
      await refreshCart();
      setMessage({
        variant: "success",
        text: `Синхронизировано: ${data.imported ?? 0} поз.`,
      });
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка синхронизации",
      });
    }
  }

  return (
    <Screen>
      <PageHeader description="Импорт, AI, умный холодильник, напоминания" />

      {message && (
        <StatusBanner variant={message.variant} onDismiss={() => setMessage(null)}>
          {message.text}
        </StatusBanner>
      )}

      <Card className="mb-4">
        <h2 className="mb-3 text-sm font-semibold">Покупки и запасы</h2>
        <label className="mb-1 block text-xs text-slate-500">Мин. запас для корзины</label>
        <Input
          type="number"
          min={0}
          step={0.5}
          className="mb-3"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value) || 1)}
        />
        <label className="mb-1 block text-xs text-slate-500">История заказов (дней)</label>
        <Input
          type="number"
          min={7}
          max={365}
          className="mb-3"
          value={historyDays}
          onChange={(e) => setHistoryDays(parseInt(e.target.value, 10) || 90)}
        />
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={expiryOn}
            onChange={(e) => setExpiryOn(e.target.checked)}
            className="rounded border-slate-300"
          />
          Напоминания о сроке годности
        </label>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">OpenAI Vision</h2>
        <p className="mb-2 text-xs text-slate-500">
          {hasOpenAiKey ? "Ключ сохранён" : "Pro использует серверный OPENAI_API_KEY"}
        </p>
        <Input
          type="password"
          placeholder={hasOpenAiKey ? "Новый ключ (оставьте пустым)" : "sk-..."}
          value={openaiKey}
          onChange={(e) => {
            setOpenaiKey(e.target.value);
            setClearOpenAi(false);
          }}
          className="mb-2"
        />
        {hasOpenAiKey && (
          <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={clearOpenAi}
              onChange={(e) => setClearOpenAi(e.target.checked)}
            />
            Удалить сохранённый ключ
          </label>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">Умный холодильник</h2>
        <p className="mb-2 text-xs text-slate-500">
          Home Assistant: GET /api/jfreeze/inventory?zone=fridge
        </p>
        <Input
          className="mb-2"
          placeholder="http://homeassistant.local:8123"
          value={smartUrl}
          onChange={(e) => setSmartUrl(e.target.value)}
        />
        <Input
          type="password"
          className="mb-2"
          placeholder="Токен (если нужен)"
          value={smartToken}
          onChange={(e) => setSmartToken(e.target.value)}
        />
        <Button variant="secondary" className="mb-2 w-full" onClick={() => void syncSmartFridge()}>
          Синхронизировать сейчас
        </Button>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">Напоминания</h2>
        <PushEnable />
      </Card>

      <Button className="mb-6 w-full" disabled={saving} onClick={() => void saveSettings()}>
        {saving ? "Сохранение…" : "Сохранить настройки"}
      </Button>

      <h2 className="mb-2 text-sm font-semibold">Магазины</h2>
      <ul className="mb-6 space-y-2">
        {stores.map((store) => (
          <li key={store.id}>
            <Card className="flex items-center justify-between gap-2 py-3">
              <div>
                <span className="font-medium">{store.label ?? store.displayName}</span>
                <div className="mt-1">
                  <StoreBadge availability={store.availability} />
                </div>
              </div>
              <Button
                variant="secondary"
                className="shrink-0 py-2 text-xs"
                onClick={() => void storeAction(store.id, store.availability)}
              >
                {store.availability === "active" ? "Синхр." : "CSV"}
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="mb-2 font-semibold">Импорт CSV</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {CSV_TEMPLATES.map((t) => (
            <Chip
              key={t.id}
              active={templateId === t.id}
              onClick={() => applyTemplate(t.id)}
            >
              {t.name}
            </Chip>
          ))}
        </div>
        <textarea
          className="mb-3 h-36 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <Button onClick={() => void importCsv()}>Импортировать</Button>
      </Card>
    </Screen>
  );
}
