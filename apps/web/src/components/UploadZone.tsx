"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetchRaw } from "@/lib/api/client";
import { Button } from "./ui/Button";
import { StatusBanner } from "./ui/StatusBanner";

export interface PhotoRecognitionResult {
  photoId: string;
  detected: Array<{ name: string; qty: number; unit: string; confidence?: number }>;
  recognition?: {
    mode: "ai" | "demo";
    modelLabel: string;
    needsOpenAiKey: boolean;
  };
}

interface UploadZoneProps {
  zone: "fridge" | "freezer";
  onComplete: (data: PhotoRecognitionResult) => void;
}

export function UploadZone({ zone, onComplete }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<"ai" | "demo" | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setLastMode(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("zone", zone);
      const res = await apiFetchRaw("/api/fridge/photo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);

      const mode = data.recognition?.mode ?? "demo";
      setLastMode(mode);

      onComplete({
        photoId: data.photoId,
        detected: (data.detected ?? []).map(
          (d: { name: string; qty: number; unit: string; confidence?: number }) => ({
            name: d.name,
            qty: d.qty,
            unit: d.unit,
            confidence: d.confidence,
          }),
        ),
        recognition: data.recognition,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось обработать фото");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-sky-200/80 bg-sky-50/40 p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <p className="mb-1 text-sm font-medium text-slate-700">
        {zone === "freezer" ? "Фото морозилки" : "Фото холодильника"}
      </p>
      <p className="mb-3 text-xs text-slate-500 leading-relaxed">
        Снимите полки при открытой двери. Распознавание по фото — через OpenAI Vision (ключ в
        настройках).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Распознаю…" : "Сфотографировать"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => {
            const el = inputRef.current;
            if (el) {
              el.removeAttribute("capture");
              el.click();
              el.setAttribute("capture", "environment");
            }
          }}
        >
          Из галереи
        </Button>
      </div>
      {lastMode === "ai" && (
        <p className="mt-2 text-xs font-medium text-emerald-700">
          ✓ Распознано AI с учётом модели холодильника
        </p>
      )}
      {lastMode === "demo" && (
        <div className="mt-3 text-left">
          <StatusBanner variant="info">
            Демо-список для правки. Добавьте{" "}
            <Link href="/settings" className="font-semibold underline">
              ключ OpenAI
            </Link>{" "}
            для распознавания по фото.
          </StatusBanner>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
