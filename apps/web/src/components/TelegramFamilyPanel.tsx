"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Section } from "./ui/Section";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { StatusBanner } from "./ui/StatusBanner";
import { ActionBar } from "./ui/ActionBar";
import { apiFetch, ApiError, refreshCart } from "@/lib/api/client";

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
  hasOfdCaption?: boolean;
}

export function TelegramFamilyPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkExpires, setLinkExpires] = useState<string | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
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

  async function importFridge(id: string) {
    setLoadingId(id);
    setError(null);
    try {
      const data = await apiFetch<{
        photoId: string;
        detected: unknown[];
        recognition?: unknown;
        demoTemplate?: unknown[];
      }>(`/api/telegram/inbox/${id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fridge", zone: "fridge" }),
      });
      sessionStorage.setItem("jfreeze-fridge-import", JSON.stringify(data));
      router.push("/fridge");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка");
    } finally {
      setLoadingId(null);
    }
  }

  async function importReceipt(id: string) {
    setLoadingId(id);
    setError(null);
    try {
      const data = await apiFetch<{ imported: number }>(
        `/api/telegram/inbox/${id}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "receipt" }),
        },
      );
      await refreshCart();
      setMessage(`Чек импортирован: ${data.imported} заказ(ов)`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка импорта чека");
    } finally {
      setLoadingId(null);
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
            <a
              href="https://t.me/BotFather"
              className="text-[var(--brand)] underline"
              target="_blank"
              rel="noreferrer"
            >
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
                  <a
                    href={botLink}
                    className="text-[var(--brand)] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{status.botUsername}
                  </a>
                </>
              )}
            </p>
            <ActionBar className="mt-3">
              <Button disabled={loading} onClick={() => void createLink()}>
                Получить код привязки
              </Button>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => void sendExpiryNotify()}
              >
                Сроки в Telegram
              </Button>
            </ActionBar>
            {linkCode && (
              <Panel variant="muted" className="mt-3 font-mono text-center">
                <p className="text-xs text-slate-500 mb-1">Отправьте боту:</p>
                <p className="text-lg font-bold tracking-widest text-slate-900">
                  /link {linkCode}
                </p>
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
              <ul className="space-y-3">
                {inbox.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      {item.kind === "photo" && (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                          />
                        </a>
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        <span className="font-medium text-slate-800">
                          {item.uploaderName ?? "Семья"}
                        </span>
                        <span className="text-slate-500">
                          {" "}
                          · {item.kind === "photo" ? "фото" : "файл"}
                          {" · "}
                          {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                          {item.hasOfdCaption && (
                            <span className="text-emerald-700"> · QR в подписи</span>
                          )}
                        </span>
                        {item.caption && (
                          <p className="truncate text-xs text-slate-500">{item.caption}</p>
                        )}
                      </div>
                    </div>
                    {item.kind === "photo" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="text-xs py-1"
                          disabled={loadingId === item.id}
                          onClick={() => void importFridge(item.id)}
                        >
                          В холодильник
                        </Button>
                        {item.hasOfdCaption && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-xs py-1"
                            disabled={loadingId === item.id}
                            onClick={() => void importReceipt(item.id)}
                          >
                            Чек ОФД
                          </Button>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="self-center text-xs font-semibold text-sky-700"
                        >
                          Открыть
                        </a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel variant="muted" className="text-xs leading-relaxed text-slate-600">
            <p className="font-medium text-slate-800">В боте</p>
            <p className="mt-1">
              Фото холодильника → лента → «В холодильник» в приложении. Подпись с QR чека →
              импорт в заказы. Команды: /fridge · /orders · /notify
            </p>
          </Panel>
        </>
      )}
    </Section>
  );
}
