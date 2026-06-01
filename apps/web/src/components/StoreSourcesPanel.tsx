"use client";

import { useCallback, useRef, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Section } from "./ui/Section";
import { SegmentedControl } from "./ui/SegmentedControl";
import { Chip } from "./ui/Chip";
import { StatusBanner } from "./ui/StatusBanner";
import { ApiError, apiFetch, apiFetchRaw, refreshCart } from "@/lib/api/client";
import type { StoreChannelPrefs } from "@/lib/sources/types";
import { IMAP_PRESETS, type ImapPresetId, applyImapPreset } from "@/lib/sources/imap-presets";
import { formatRelativeRu } from "@/lib/format/relative-time";

type Tab = "stores" | "email" | "sms" | "imap";

interface CatalogItem {
  id: string;
  name: string;
  storeId: string;
  prefs: StoreChannelPrefs;
}

interface SourcesState {
  catalog: CatalogItem[];
  lastImapSyncAt: string | null;
  imap: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
    mailbox: string;
    sinceDays: number;
    autoSyncIntervalHours: number;
    hasPassword?: boolean;
  };
}

interface StoreSourcesPanelProps {
  onImported?: () => void;
}

export function StoreSourcesPanel({ onImported }: StoreSourcesPanelProps) {
  const emlRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("stores");
  const [state, setState] = useState<SourcesState | null>(null);
  const [emailText, setEmailText] = useState("");
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<SourcesState>("/api/sources");
      setState(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    }
  }, []);

  useOnMount(load);

  async function savePrefs(catalog: CatalogItem[]) {
    const connections: Record<string, StoreChannelPrefs> = {};
    for (const c of catalog) connections[c.id] = c.prefs;
    await apiFetch("/api/sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connections }),
    });
  }

  function toggleCatalog(id: string, field: keyof StoreChannelPrefs) {
    if (!state) return;
    const catalog = state.catalog.map((c) => {
      if (c.id !== id) return c;
      const prefs = { ...c.prefs, [field]: !c.prefs[field] };
      if (field === "enabled") return { ...c, prefs };
      return { ...c, prefs };
    });
    setState({ ...state, catalog });
    void savePrefs(catalog);
  }

  async function importChannel(channel: "email" | "sms") {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("channel", channel);
      form.append("autoImport", "true");
      if (channel === "email") {
        if (!emailText.trim()) {
          setError("Вставьте текст письма");
          return;
        }
        form.append("text", emailText.trim());
      } else {
        if (!smsText.trim()) {
          setError("Вставьте SMS");
          return;
        }
        form.append("text", smsText.trim());
      }

      const res = await apiFetchRaw("/api/sources/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);

      setMessage(data.message ?? `Импортировано: ${data.imported ?? 0}`);
      if (data.warnings?.length) {
        setMessage((m) => `${m}. ${data.warnings.join(" ")}`);
      }
      if (data.imported > 0) {
        await refreshCart();
        onImported?.();
        if (channel === "email") setEmailText("");
        if (channel === "sms") setSmsText("");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось импортировать");
    } finally {
      setLoading(false);
    }
  }

  async function handleEml(file: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("channel", "email");
      form.append("autoImport", "true");
      form.append("file", file);
      const res = await apiFetchRaw("/api/sources/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);
      setMessage(data.message);
      if (data.imported > 0) {
        await refreshCart();
        onImported?.();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка .eml");
    } finally {
      setLoading(false);
    }
  }

  async function saveImap() {
    if (!state) return;
    setLoading(true);
    try {
      await apiFetch("/api/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imap: state.imap }),
      });
      setMessage("Настройки почты сохранены");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  async function syncImap() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{
        message: string;
        imported?: number;
        scanned?: number;
      }>("/api/sources/sync", {
        method: "POST",
      });
      setMessage(data.message);
      if ((data.imported ?? 0) > 0) {
        await refreshCart();
        onImported?.();
      }
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка синхронизации");
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(presetId: ImapPresetId) {
    if (!state) return;
    setState({
      ...state,
      imap: applyImapPreset(
        {
          ...state.imap,
          password: state.imap.password,
        },
        presetId,
      ),
    });
    setMessage(IMAP_PRESETS[presetId].hint);
  }

  return (
    <Section title="Источники заказов" description="Почта и SMS — без платных API магазинов">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}

      <SegmentedControl
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "stores", label: "Магазины" },
          { value: "email", label: "Почта" },
          { value: "sms", label: "SMS" },
          { value: "imap", label: "IMAP" },
        ]}
      />

      {tab === "stores" && state && (
        <Panel className="mt-3 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Включите магазины, с которых приходят письма и SMS. jFreeze определит отправителя и
            добавит заказы в историю.
          </p>
          <ul className="space-y-2">
            {state.catalog.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 justify-between border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="font-medium text-slate-800">{item.name}</span>
                <div className="flex flex-wrap gap-1">
                  <Chip
                    active={item.prefs.enabled}
                    onClick={() => toggleCatalog(item.id, "enabled")}
                  >
                    {item.prefs.enabled ? "Вкл" : "Выкл"}
                  </Chip>
                  <Chip
                    active={item.prefs.email}
                    onClick={() => toggleCatalog(item.id, "email")}
                  >
                    Email
                  </Chip>
                  <Chip
                    active={item.prefs.sms}
                    onClick={() => toggleCatalog(item.id, "sms")}
                  >
                    SMS
                  </Chip>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "email" && (
        <Panel className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            Скопируйте письмо с заказом или чеком OFD (Озон, Wildberries, банк). В Gmail: «Показать
            оригинал» → сохранить как <code className="text-xs">.eml</code>.
          </p>
          <textarea
            className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm"
            placeholder="Вставьте текст письма…"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <input
            ref={emlRef}
            type="file"
            accept=".eml,message/rfc822"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleEml(f);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={loading} onClick={() => importChannel("email")}>
              Импорт из текста
            </Button>
            <Button variant="secondary" disabled={loading} onClick={() => emlRef.current?.click()}>
              Файл .eml
            </Button>
          </div>
        </Panel>
      )}

      {tab === "sms" && (
        <Panel className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            Вставьте SMS от банка (Сбер, Т-Банк) или магазина. Несколько сообщений — через пустую
            строку.
          </p>
          <textarea
            className="w-full min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm font-mono"
            placeholder="MIR-1234 01.06.26 Покупка 1234.56р PYATEROCHKA Баланс: ..."
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
          />
          <Button disabled={loading} onClick={() => importChannel("sms")}>
            Импорт SMS
          </Button>
        </Panel>
      )}

      {tab === "imap" && state && (
        <Panel className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            Пароль хранится только в локальной SQLite на вашем устройстве. Используйте пароль
            приложения, не основной пароль почты.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(IMAP_PRESETS) as ImapPresetId[]).map((id) => (
              <Button
                key={id}
                type="button"
                variant="secondary"
                className="px-3 py-2 text-xs"
                onClick={() => applyPreset(id)}
              >
                {IMAP_PRESETS[id].label}
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.imap.enabled}
              onChange={(e) =>
                setState({
                  ...state,
                  imap: { ...state.imap, enabled: e.target.checked },
                })
              }
            />
            Включить авто-проверку почты
          </label>
          <label className="block text-sm text-slate-600">
            IMAP-хост
            <Input
              className="mt-1"
              value={state.imap.host}
              onChange={(e) =>
                setState({ ...state, imap: { ...state.imap, host: e.target.value } })
              }
            />
          </label>
          <label className="block text-sm text-slate-600">
            Порт
            <Input
              className="mt-1"
              type="number"
              value={String(state.imap.port)}
              onChange={(e) =>
                setState({
                  ...state,
                  imap: { ...state.imap, port: Number(e.target.value) || 993 },
                })
              }
            />
          </label>
          <label className="block text-sm text-slate-600">
            Email
            <Input
              className="mt-1"
              value={state.imap.user}
              onChange={(e) =>
                setState({ ...state, imap: { ...state.imap, user: e.target.value } })
              }
            />
          </label>
          <label className="block text-sm text-slate-600">
            Пароль приложения
            <Input
              className="mt-1"
              type="password"
              value={state.imap.password}
              placeholder={state.imap.hasPassword ? "••••••••" : ""}
              onChange={(e) =>
                setState({ ...state, imap: { ...state.imap, password: e.target.value } })
              }
            />
          </label>
          <label className="block text-sm text-slate-600">
            Авто-синхронизация
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={String(state.imap.autoSyncIntervalHours ?? 0)}
              onChange={(e) =>
                setState({
                  ...state,
                  imap: {
                    ...state.imap,
                    autoSyncIntervalHours: Number(e.target.value),
                  },
                })
              }
            >
              <option value="0">Только вручную</option>
              <option value="6">Каждые 6 часов</option>
              <option value="12">Каждые 12 часов</option>
              <option value="24">Раз в сутки</option>
            </select>
          </label>
          <label className="block text-sm text-slate-600">
            Письма за последние (дней)
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={365}
              value={String(state.imap.sinceDays ?? 30)}
              onChange={(e) =>
                setState({
                  ...state,
                  imap: {
                    ...state.imap,
                    sinceDays: Math.min(365, Math.max(1, Number(e.target.value) || 30)),
                  },
                })
              }
            />
          </label>
          <label className="block text-sm text-slate-600">
            Папка (mailbox)
            <Input
              className="mt-1"
              value={state.imap.mailbox}
              onChange={(e) =>
                setState({ ...state, imap: { ...state.imap, mailbox: e.target.value } })
              }
            />
          </label>
          {state.lastImapSyncAt && (
            <p className="text-xs text-slate-500">
              Последняя синхронизация:{" "}
              {formatRelativeRu(new Date(state.lastImapSyncAt))}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={loading} onClick={() => saveImap()}>
              Сохранить
            </Button>
            <Button disabled={loading} onClick={() => syncImap()}>
              {loading ? "Синхронизация…" : "Синхронизировать почту"}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Ищем письма только от включённых магазинов (вкладка «Магазины») — быстрее и
            меньше шума. Уведомления в Telegram — одним сообщением за синхронизацию.
          </p>
        </Panel>
      )}
    </Section>
  );
}
