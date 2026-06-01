"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { LoadingBlock } from "./ui/LoadingBlock";
import { apiFetch, ApiError } from "@/lib/api/client";

interface Alert {
  id: string;
  name: string;
  qty: number;
  unit: string | null;
  zone: string;
  urgency: string;
  daysLeft: number;
}

const urgencyLabel: Record<string, string> = {
  expired: "просрочено",
  today: "сегодня",
  soon: "скоро",
};

const urgencyStyle: Record<string, string> = {
  expired: "border-red-200 bg-red-50 text-red-950",
  today: "border-amber-200 bg-amber-50 text-amber-950",
  soon: "border-yellow-200 bg-yellow-50/80 text-yellow-950",
};

const zoneLabel: Record<string, string> = {
  fridge: "холодильник",
  freezer: "морозилка",
  pantry: "кладовая",
};

export function ExpiryAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [telegramOk, setTelegramOk] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotifyMsg(null);
    try {
      const [expiry, tg] = await Promise.all([
        apiFetch<{ alerts: Alert[] }>("/api/expiry?days=7"),
        apiFetch<{ configured: boolean; linkedCount: number }>("/api/telegram/link").catch(
          () => ({ configured: false, linkedCount: 0 }),
        ),
      ]);
      setAlerts(expiry.alerts ?? []);
      setTelegramOk(Boolean(tg.configured && tg.linkedCount > 0));
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useOnMount(load);

  async function sendTelegram() {
    try {
      await apiFetch("/api/telegram/notify", { method: "POST" });
      setNotifyMsg("Отправлено в Telegram");
    } catch (e) {
      setNotifyMsg(e instanceof ApiError ? e.message : "Ошибка отправки");
    }
  }

  if (loading) {
    return (
      <Card className="mb-4 py-6">
        <LoadingBlock label="Срок годности…" />
      </Card>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Срок годности</h2>
        <div className="flex items-center gap-2">
          {telegramOk && (
            <Button
              type="button"
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={() => void sendTelegram()}
            >
              В Telegram
            </Button>
          )}
          <button
            type="button"
            className="text-xs font-medium text-sky-600"
            onClick={() => void load()}
          >
            Обновить
          </button>
          <Link href="/fridge" className="text-xs font-medium text-sky-600">
            Холодильник →
          </Link>
        </div>
      </div>
      {notifyMsg && (
        <p className="mb-2 text-xs text-slate-600">{notifyMsg}</p>
      )}
      <ul className="space-y-2">
        {alerts.slice(0, 6).map((a) => (
          <li
            key={a.id}
            className={`rounded-lg border px-3 py-2 text-sm ${urgencyStyle[a.urgency] ?? ""}`}
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium">{a.name}</span>
              <span className="shrink-0 opacity-80 tabular-nums">
                {a.qty} {a.unit ?? "шт"}
              </span>
            </div>
            <p className="mt-0.5 text-xs opacity-75">
              {zoneLabel[a.zone] ?? a.zone} ·{" "}
              {urgencyLabel[a.urgency] ??
                (a.daysLeft <= 0 ? "просрочено" : `через ${a.daysLeft} дн.`)}
            </p>
          </li>
        ))}
      </ul>
      {alerts.length > 6 && (
        <p className="mt-2 text-xs text-slate-500">и ещё {alerts.length - 6}…</p>
      )}
    </Card>
  );
}
