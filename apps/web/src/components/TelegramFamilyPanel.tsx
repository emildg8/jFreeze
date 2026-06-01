"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Section } from "./ui/Section";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { StatusBanner } from "./ui/StatusBanner";
import { ActionBar } from "./ui/ActionBar";
import { apiFetch, ApiError } from "@/lib/api/client";

interface TelegramStatus {
  configured: boolean;
  botUsername: string | null;
  linkedCount: number;
  appUrl: string;
  chats: Array<{ displayName: string | null; username: string | null }>;
}

interface InboxItem {
  id: string;
  uploaderName: string | null;
  kind: string;
  caption: string | null;
  createdAt: string;
  url: string;
}

export function TelegramFamilyPanel() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkExpires, setLinkExpires] = useState<string | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [st, inboxRes] = await Promise.all([
        apiFetch<TelegramStatus>("/api/telegram/link"),
        apiFetch<{ items: InboxItem[] }>("/api/telegram/inbox"),
      ]);
      setStatus(st);
      setInbox(inboxRes.items ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    }
  }, []);

  useOnMount(load);

  async function createLink() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ token: string; expiresAt: string; hint: string }>(
        "/api/telegram/link",
        { method: "POST" },
      );
      setLinkCode(data.token);
      setLinkExpires(data.expiresAt);
      setMessage(data.hint);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось получить код");
    } finally {
      setLoading(false);
    }
  }

  async function sendExpiryNotify() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/telegram/notify", { method: "POST" });
      setMessage("Напоминания о сроках отправлены в Telegram");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const botLink = status?.botUsername
    ? `https://t.me/${status.botUsername}`
    : "https://t.me";

  return (
    <Section title="Telegram-бот" description="Уведомления и семейная лента файлов">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}

      {!status?.configured ? (
        <Panel variant="warning">
          <p className="text-sm leading-relaxed text-slate-700">
            Добавьте <code className="text-xs">TELEGRAM_BOT_TOKEN</code> в{" "}
            <code className="text-xs">.env.local</code> и перезапустите сервер. Токен
            бесплатный у{" "}
            <a href="https://t.me/BotFather" className="text-[var(--brand)] underline" target="_blank" rel="noreferrer">
              @BotFather
            </a>
            .
          </p>
        </Panel>
      ) : (
        <>
          <Panel variant="accent">
            <p className="text-sm text-slate-600">
              Привязано чатов: <strong>{status.linkedCount}</strong>
              {status.botUsername && (
                <>
                  {" "}
                  · Бот:{" "}
                  <a href={botLink} className="text-[var(--brand)] underline" target="_blank" rel="noreferrer">
                    @{status.botUsername}
                  </a>
                </>
              )}
            </p>
            <ActionBar className="mt-3">
              <Button disabled={loading} onClick={() => void createLink()}>
                Получить код привязки
              </Button>
              <Button variant="secondary" disabled={loading} onClick={() => void sendExpiryNotify()}>
                Сроки в Telegram
              </Button>
            </ActionBar>
            {linkCode && (
              <Panel variant="muted" className="mt-3 font-mono text-center">
                <p className="text-xs text-slate-500 mb-1">Отправьте боту:</p>
                <p className="text-lg font-bold tracking-widest text-slate-900">/link {linkCode}</p>
                {linkExpires && (
                  <p className="mt-1 text-xs text-slate-500">
                    до {new Date(linkExpires).toLocaleTimeString("ru-RU")}
                  </p>
                )}
              </Panel>
            )}
          </Panel>

          {inbox.length > 0 && (
            <Panel>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Семейная лента</h3>
              <ul className="space-y-2">
                {inbox.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0"
                  >
                    <div className="min-w-0 text-sm">
                      <span className="font-medium text-slate-800">
                        {item.uploaderName ?? "Семья"}
                      </span>
                      <span className="text-slate-500">
                        {" "}
                        · {item.kind === "photo" ? "фото" : "файл"}
                        {" · "}
                        {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                      {item.caption && (
                        <p className="truncate text-xs text-slate-500">{item.caption}</p>
                      )}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-semibold text-sky-700"
                    >
                      Открыть
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel variant="muted" className="text-xs leading-relaxed text-slate-600">
            <p className="font-medium text-slate-800">В боте</p>
            <p className="mt-1">
              Фото и документы → общая лента · /fridge · /orders · /notify · несколько членов
              семьи с разными телефонами — каждый /link свой код
            </p>
          </Panel>
        </>
      )}
    </Section>
  );
}
