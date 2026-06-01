"use client";

import { useRef, useState } from "react";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SegmentedControl } from "./ui/SegmentedControl";
import { Section } from "./ui/Section";
import { ApiError, apiFetchRaw } from "@/lib/api/client";

type Tab = "file" | "photo" | "email" | "ofd";

interface ParsedItem {
  name: string;
  qty: number;
  unit: string;
}

interface ParseResponse {
  items: ParsedItem[];
  orderedAt?: string;
  totalRub?: number;
  kind?: string;
  preview?: string;
  verifyUrl?: string;
  source?: string;
}

interface ReceiptImportPanelProps {
  onImported: () => void;
}

const ACCEPT =
  ".csv,.txt,.pdf,.eml,image/jpeg,image/png,image/webp,text/csv,text/plain,message/rfc822,application/pdf";

export function ReceiptImportPanel({ onImported }: ReceiptImportPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const emlRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailText, setEmailText] = useState("");
  const [ofdQr, setOfdQr] = useState("");
  const [pending, setPending] = useState<ParseResponse | null>(null);
  const qrPhotoRef = useRef<HTMLInputElement>(null);

  async function parseForm(form: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchRaw("/api/receipts/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);
      if (data.autoImport) {
        setPending(null);
        onImported();
        return;
      }
      setPending(data as ParseResponse);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось разобрать чек");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    await parseForm(form);
  }

  async function handleEmailPaste() {
    if (!emailText.trim()) return;
    const form = new FormData();
    form.append("text", emailText.trim());
    await parseForm(form);
  }

  async function parseOfdQrText(qr: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchRaw("/api/receipts/ofd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: qr.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);
      setPending({
        items: data.items ?? [],
        orderedAt: data.orderedAt,
        totalRub: data.totalRub,
        kind: `ОФД (${data.source ?? "qr"})`,
        verifyUrl: data.verifyUrl,
        source: data.source,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось разобрать QR");
    } finally {
      setLoading(false);
    }
  }

  async function handleOfdQr() {
    if (!ofdQr.trim()) return;
    await parseOfdQrText(ofdQr);
  }

  async function scanOfdFromImage(file: File) {
    setLoading(true);
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("ofd-qr-scratch", { verbose: false });
      const decoded = await scanner.scanFile(file, false);
      await scanner.clear();
      setOfdQr(decoded);
      await parseOfdQrText(decoded);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "QR не найден на фото. Вставьте строку вручную.",
      );
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!pending?.items.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchRaw("/api/receipts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          items: pending.items,
          orderedAt: pending.orderedAt,
          totalRub: pending.totalRub,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);
      setPending(null);
      setEmailText("");
      onImported();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section
      title="Загрузить чек"
      description="ОФД QR, фото, PDF, CSV, письмо (.eml) или текст из почты"
    >
      <div id="ofd-qr-scratch" className="sr-only" aria-hidden />
      <SegmentedControl
        options={[
          { value: "ofd", label: "QR ОФД" },
          { value: "file", label: "Файл" },
          { value: "photo", label: "Фото" },
          { value: "email", label: "Почта" },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-3"
      />

      {tab === "ofd" && (
        <Panel variant="accent">
          <p className="mb-2 text-xs leading-relaxed text-slate-600">
            Отсканируйте QR с кассового чека или вставьте строку / ссылку (t=, s=, fn=, i=,
            fp=). Позиции подтягиваются с сайта ОФД или по API (опционально{" "}
            <code className="text-[10px]">PROVERKA_CHEKA_TOKEN</code>).
          </p>
          <textarea
            className="mb-2 h-24 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="t=20250601T1530&s=1234.56&fn=...&i=...&fp=..."
            value={ofdQr}
            onChange={(e) => setOfdQr(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading || !ofdQr.trim()}
              onClick={() => void handleOfdQr()}
            >
              {loading ? "Разбор…" : "Разобрать QR"}
            </Button>
            <input
              ref={qrPhotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void scanOfdFromImage(f);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() => qrPhotoRef.current?.click()}
            >
              QR с фото
            </Button>
          </div>
        </Panel>
      )}

      {tab === "file" && (
        <Panel variant="accent" className="text-center">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <p className="mb-2 text-xs text-slate-600">
            CSV, TXT, PDF, EML — перетащите или выберите
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
          >
            {loading ? "Разбор…" : "Выбрать файл"}
          </Button>
        </Panel>
      )}

      {tab === "photo" && (
        <Panel variant="accent" className="text-center">
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <p className="mb-2 text-xs text-slate-600">
            Снимок или скрин чека · AI при ключе OpenAI, иначе используйте PDF/текст
          </p>
          <Button
            type="button"
            disabled={loading}
            onClick={() => photoRef.current?.click()}
          >
            {loading ? "Разбор…" : "Сфотографировать / выбрать"}
          </Button>
        </Panel>
      )}

      {tab === "email" && (
        <Panel variant="accent">
          <p className="mb-2 text-xs text-slate-600">
            Вставьте текст чека из письма (Ozon, Сбер, OFD) или загрузите{" "}
            <strong>.eml</strong> (Gmail → «Скачать сообщение», Outlook → «Сохранить как»)
          </p>
          <textarea
            className="mb-2 h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="Вставьте текст письма с чеком…"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !emailText.trim()}
              onClick={() => void handleEmailPaste()}
            >
              Разобрать текст
            </Button>
            <input
              ref={emlRef}
              type="file"
              accept=".eml,message/rfc822"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              disabled={loading}
              onClick={() => emlRef.current?.click()}
            >
              Файл .eml
            </Button>
          </div>
        </Panel>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending && pending.items.length > 0 && (
        <Panel className="mt-3">
          <p className="mb-2 text-sm font-medium text-slate-800">
            Проверьте позиции ({pending.kind})
          </p>
          {pending.totalRub != null && (
            <p className="mb-2 text-xs text-slate-500 tabular-nums">
              Итого: ~{pending.totalRub} ₽
              {pending.source === "qr-only" && " · уточните позиции вручную"}
            </p>
          )}
          {pending.verifyUrl && (
            <a
              href={pending.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 block text-xs text-sky-600 underline"
            >
              Открыть чек на сайте ОФД →
            </a>
          )}
          <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto">
            {pending.items.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <Input
                  className="flex-1 text-sm"
                  value={item.name}
                  onChange={(e) => {
                    const next = [...pending.items];
                    next[idx] = { ...item, name: e.target.value };
                    setPending({ ...pending, items: next });
                  }}
                />
                <Input
                  className="w-16 text-sm"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={item.qty}
                  onChange={(e) => {
                    const next = [...pending.items];
                    next[idx] = {
                      ...item,
                      qty: parseFloat(e.target.value) || 1,
                    };
                    setPending({ ...pending, items: next });
                  }}
                />
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={loading} onClick={() => void confirmImport()}>
              {loading ? "…" : "Добавить в заказы"}
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Отмена
            </Button>
          </div>
        </Panel>
      )}
    </Section>
  );
}
