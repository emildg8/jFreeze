"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NavCard } from "@/components/ui/NavCard";
import { StoreBadge } from "@/components/StoreBadge";
import { PushEnable } from "@/components/PushEnable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Chip } from "@/components/ui/Chip";
import { ActionBar } from "@/components/ui/ActionBar";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ServerConnectionPanel } from "@/components/ServerConnectionPanel";
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function SettingsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
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
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStoresLoading(true);
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
    } finally {
      setStoresLoading(false);
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
          text: "Шаблон CSV выбран ниже — нажмите «Импортировать»",
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
      const data = await apiFetch<{ imported?: number }>("/api/smart-fridge/sync", {
        method: "POST",
      });
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
      <PageHeader description="Импорт заказов, AI, умный холодильник, напоминания" />

      {message && (
        <StatusBanner variant={message.variant} onDismiss={() => setMessage(null)}>
          {message.text}
        </StatusBanner>
      )}

      <ServerConnectionPanel />

      <Section title="Источники заказов">
        <NavCard
          href="/sources"
          label="Почта и SMS"
          description="Озон, банки, ОФД — без платных API магазинов"
          icon="📬"
        />
      </Section>

      <Section title="Покупки и запасы">
        <Panel variant="accent">
          <div className="space-y-4">
            <Field label="Мин. запас для корзины" hint="Ниже этого количества товар попадёт в корзину">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 1)}
              />
            </Field>
            <Field label="История заказов, дней">
              <Input
                type="number"
                min={7}
                max={365}
                value={historyDays}
                onChange={(e) => setHistoryDays(parseInt(e.target.value, 10) || 90)}
              />
            </Field>
            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={expiryOn}
                onChange={(e) => setExpiryOn(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-sky-200"
              />
              Напоминания о сроке годности
            </label>
          </div>
        </Panel>
      </Section>

      <Section title="OpenAI Vision" description="Опционально · BYOK">
        <Panel variant="ai">
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            {hasOpenAiKey
              ? "Ключ сохранён локально. Распознавание чеков по фото через API OpenAI."
              : "Без ключа работает бесплатная эвристика по фото чека."}
          </p>
          <Field label="API-ключ">
            <Input
              type="password"
              placeholder={hasOpenAiKey ? "Новый ключ (оставьте пустым)" : "sk-..."}
              value={openaiKey}
              onChange={(e) => {
                setOpenaiKey(e.target.value);
                setClearOpenAi(false);
              }}
            />
          </Field>
          {hasOpenAiKey && (
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={clearOpenAi}
                onChange={(e) => setClearOpenAi(e.target.checked)}
                className="rounded border-slate-300"
              />
              Удалить сохранённый ключ
            </label>
          )}
        </Panel>
      </Section>

      <Section title="Умный холодильник" description="Home Assistant">
        <Panel variant="storage">
          <p className="mb-3 font-mono text-[11px] leading-relaxed text-slate-500">
            GET /api/jfreeze/inventory?zone=fridge
          </p>
          <div className="space-y-3">
            <Field label="URL сервера">
              <Input
                placeholder="http://homeassistant.local:8123"
                value={smartUrl}
                onChange={(e) => setSmartUrl(e.target.value)}
              />
            </Field>
            <Field label="Токен доступа" hint="Если настроена авторизация">
              <Input
                type="password"
                placeholder="Длинный токен HA"
                value={smartToken}
                onChange={(e) => setSmartToken(e.target.value)}
              />
            </Field>
            <Button variant="secondary" className="w-full" onClick={() => void syncSmartFridge()}>
              Синхронизировать сейчас
            </Button>
          </div>
        </Panel>
      </Section>

      <Section title="Push-напоминания">
        <Panel>
          <PushEnable />
        </Panel>
      </Section>

      <Panel variant="accent" className="sticky bottom-2 z-10">
        <Button className="w-full" disabled={saving} onClick={() => void saveSettings()}>
          {saving ? "Сохранение…" : "Сохранить настройки"}
        </Button>
      </Panel>

      <Section title="Магазины" description="Синхронизация и CSV">
        {storesLoading ? (
          <LoadingBlock />
        ) : (
          <ul className="space-y-2">
            {stores.map((store) => (
              <li key={store.id}>
                <Panel className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {store.label ?? store.displayName}
                    </p>
                    <div className="mt-1">
                      <StoreBadge availability={store.availability} />
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="shrink-0 text-xs"
                    onClick={() => void storeAction(store.id, store.availability)}
                  >
                    {store.availability === "active" ? "Синхр." : "CSV"}
                  </Button>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Импорт CSV">
        <Panel>
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
            className="mb-3 h-36 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            spellCheck={false}
          />
          <ActionBar>
            <Button onClick={() => void importCsv()}>Импортировать</Button>
          </ActionBar>
        </Panel>
      </Section>
    </Screen>
  );
}
