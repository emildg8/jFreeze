"use client";

import { useState } from "react";
import { Section } from "./ui/Section";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { ActionBar } from "./ui/ActionBar";
import { StatusBanner } from "./ui/StatusBanner";
import type { ExportFormat } from "@/lib/export/orders";

const INTEGRATIONS = [
  {
    name: "Microsoft Excel",
    hint: "Скачайте «Excel (.xls)» — откроется сразу с колонками по товарам.",
  },
  {
    name: "Google Таблицы",
    hint: "Файл → Импорт → загрузите CSV или Excel из jFreeze.",
  },
  {
    name: "Notion / Airtable",
    hint: "Импорт базы из CSV: одна строка = одна позиция в заказе.",
  },
  {
    name: "1С / учёт",
    hint: "Загрузите CSV с разделителем «;» (как в российском Excel).",
  },
  {
    name: "Свой скрипт / n8n / Make",
    hint: "JSON-экспорт: GET /api/orders/export?format=json — для локального сервера.",
  },
] as const;

function downloadUrl(format: ExportFormat, sinceDays?: number): string {
  const params = new URLSearchParams({ format });
  if (sinceDays) params.set("sinceDays", String(sinceDays));
  return `/api/orders/export?${params.toString()}`;
}

export function OrdersExportPanel({
  sinceDays,
  showIntegrations = true,
}: {
  sinceDays?: number;
  showIntegrations?: boolean;
}) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(format: ExportFormat) {
    setLoading(format);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(downloadUrl(format, sinceDays));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка выгрузки");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `jfreeze-export.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`Файл ${filename} сохранён`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выгрузить");
    } finally {
      setLoading(null);
    }
  }

  async function copyJsonLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${downloadUrl("json", sinceDays)}`
        : downloadUrl("json", sinceDays);
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Ссылка на JSON-экспорт скопирована (работает на этом устройстве)");
    } catch {
      setError("Не удалось скопировать ссылку");
    }
  }

  async function shareExport() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${downloadUrl("csv", sinceDays)}`
        : "";
    const text =
      "Выгрузка истории заказов jFreeze — откройте ссылку в браузере, где запущено приложение, или скачайте CSV/Excel в разделе «Экспорт».";
    try {
      if (navigator.share) {
        await navigator.share({ title: "jFreeze — заказы", text, url: url || undefined });
        return;
      }
      await copyJsonLink();
    } catch {
      /* cancelled */
    }
  }

  return (
    <Section
      title="Выгрузка"
      description="Excel, CSV и JSON для таблиц и других приложений"
    >
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}

      <Panel variant="accent">
        <ActionBar className="flex-col sm:flex-row">
          <Button
            disabled={loading !== null}
            onClick={() => void download("xls")}
          >
            {loading === "xls" ? "…" : "Excel (.xls)"}
          </Button>
          <Button
            variant="secondary"
            disabled={loading !== null}
            onClick={() => void download("csv")}
          >
            {loading === "csv" ? "…" : "CSV"}
          </Button>
          <Button
            variant="secondary"
            disabled={loading !== null}
            onClick={() => void download("json")}
          >
            {loading === "json" ? "…" : "JSON"}
          </Button>
        </ActionBar>
        <ActionBar className="mt-3">
          <Button variant="secondary" className="text-xs" onClick={() => void shareExport()}>
            Поделиться
          </Button>
          <Button variant="secondary" className="text-xs" onClick={() => void copyJsonLink()}>
            Ссылка API (JSON)
          </Button>
        </ActionBar>
        {sinceDays ? (
          <p className="mt-2 text-xs text-slate-500">
            Период: последние {sinceDays} дн. (как в настройках истории)
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            В файле: заказ, магазин, дата, сумма и каждая позиция отдельной строкой.
          </p>
        )}
      </Panel>

      {showIntegrations && (
        <ul className="mt-3 space-y-2">
          {INTEGRATIONS.map((item) => (
            <li key={item.name}>
              <Panel variant="muted" className="py-3">
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.hint}</p>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
