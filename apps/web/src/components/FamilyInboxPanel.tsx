"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Section } from "./ui/Section";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { StatusBanner } from "./ui/StatusBanner";
import { apiFetch, ApiError, refreshCart } from "@/lib/api/client";
import type { PhotoRecognitionResult } from "./UploadZone";

interface InboxItem {
  id: string;
  kind: string;
  caption: string | null;
  uploaderName: string | null;
  createdAt: string;
  url: string;
  hasOfdCaption?: boolean;
}

interface FamilyInboxPanelProps {
  zone: "fridge" | "freezer";
  onFridgeImport: (data: PhotoRecognitionResult) => void;
}

export function FamilyInboxPanel({ zone, onFridgeImport }: FamilyInboxPanelProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ items: InboxItem[] }>("/api/telegram/inbox");
      const photos = (res.items ?? []).filter((i) => i.kind === "photo").slice(0, 6);
      setItems(photos);
    } catch {
      setItems([]);
    }
  }, []);

  useOnMount(() => {
    void load();
  });

  async function importFridge(id: string) {
    setLoadingId(id);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<PhotoRecognitionResult & { action: string }>(
        `/api/telegram/inbox/${id}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fridge", zone }),
        },
      );
      onFridgeImport({
        photoId: data.photoId,
        detected: data.detected ?? [],
        recognition: data.recognition,
        demoTemplate: data.demoTemplate,
      });
      setMessage("Фото из Telegram — проверьте список продуктов");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка импорта");
    } finally {
      setLoadingId(null);
    }
  }

  async function importReceipt(id: string) {
    setLoadingId(id);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<{ imported: number; source: string }>(
        `/api/telegram/inbox/${id}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "receipt" }),
        },
      );
      await refreshCart();
      setMessage(
        `Чек импортирован (${data.imported} заказ, источник: ${data.source})`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка импорта чека");
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <Section
      title="Из Telegram"
      description="Фото из семейной ленты — в холодильник или чек по подписи"
    >
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Panel className="flex flex-wrap items-center gap-3 !py-3">
              <a href={item.url} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                />
              </a>
              <div className="min-w-0 flex-1 text-xs text-slate-600">
                <p className="font-medium text-slate-800">
                  {item.uploaderName ?? "Семья"}
                </p>
                <p>
                  {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                  {item.hasOfdCaption && (
                    <span className="ml-1 text-emerald-700">· QR в подписи</span>
                  )}
                </p>
                {item.caption && (
                  <p className="truncate text-slate-500">{item.caption}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 sm:flex-row">
                <Button
                  type="button"
                  className="text-xs py-1.5"
                  disabled={loadingId === item.id}
                  onClick={() => void importFridge(item.id)}
                >
                  В {zone === "freezer" ? "морозилку" : "холодильник"}
                </Button>
                {item.hasOfdCaption && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs py-1.5"
                    disabled={loadingId === item.id}
                    onClick={() => void importReceipt(item.id)}
                  >
                    Чек ОФД
                  </Button>
                )}
              </div>
            </Panel>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Больше файлов — в{" "}
        <Link href="/family" className="text-sky-700 underline">
          разделе «Семья»
        </Link>
      </p>
    </Section>
  );
}
