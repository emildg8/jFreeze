"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { StatusBanner } from "./ui/StatusBanner";

export function PushEnable() {
  const [status, setStatus] = useState<{
    variant: "info" | "success" | "error";
    text: string;
  } | null>(null);

  async function enableReminders() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus({ variant: "error", text: "Браузер не поддерживает уведомления" });
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus({ variant: "error", text: "Разрешите уведомления в настройках браузера" });
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const { apiFetchRaw } = await import("@/lib/api/client");
      await apiFetchRaw("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "local-reminders", keys: {} }),
      });
      reg.active?.postMessage({ type: "CHECK_EXPIRY" });
      setStatus({
        variant: "success",
        text: "Локальные напоминания о сроке годности включены",
      });
    } catch {
      setStatus({ variant: "error", text: "Не удалось включить напоминания" });
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Напоминания о продуктах с истекающим сроком (через Service Worker).
      </p>
      <Button variant="secondary" onClick={() => void enableReminders()}>
        Включить напоминания
      </Button>
      {status && (
        <div className="mt-3">
          <StatusBanner variant={status.variant}>{status.text}</StatusBanner>
        </div>
      )}
    </div>
  );
}
