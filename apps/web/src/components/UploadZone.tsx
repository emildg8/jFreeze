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
    photoHint?: string;
    needsOpenAiKey: boolean;
    hasOpenAiKey?: boolean;
  };
  demoTemplate?: Array<{ name: string; qty: number; unit: string; confidence?: number }>;
}

interface UploadZoneProps {
  zone: "fridge" | "freezer";
  photoHint?: string;
  onComplete: (data: PhotoRecognitionResult) => void;
}

const MAX_CLIENT_BYTES = 8 * 1024 * 1024;

export function UploadZone({ zone, photoHint, onComplete }: UploadZoneProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<"ai" | "demo" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingDemo, setPendingDemo] = useState<PhotoRecognitionResult | null>(null);

  function mapApiPhoto(data: {
    photoId: string;
    detected?: Array<{
      name: string;
      qty: number;
      unit: string;
      confidence?: number;
    }>;
    recognition?: PhotoRecognitionResult["recognition"];
    demoTemplate?: PhotoRecognitionResult["demoTemplate"];
  }): PhotoRecognitionResult {
    return {
      photoId: data.photoId,
      detected: (data.detected ?? []).map((d) => ({
        name: d.name,
        qty: d.qty,
        unit: d.unit,
        confidence: d.confidence,
      })),
      recognition: data.recognition,
      demoTemplate: data.demoTemplate,
    };
  }

  async function uploadOne(file: File): Promise<PhotoRecognitionResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("zone", zone);
    const res = await apiFetchRaw("/api/fridge/photo", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);
    return mapApiPhoto(data);
  }

  async function handleFile(file: File) {
    if (file.size > MAX_CLIENT_BYTES) {
      setError("Фото больше 8 МБ — сожмите или выберите другое");
      return;
    }

    setLoading(true);
    setError(null);
    setLastMode(null);
    setPendingDemo(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const result = await uploadOne(file);
      const mode = result.recognition?.mode ?? "demo";
      setLastMode(mode);

      if (result.detected.length === 0 && mode === "demo" && result.demoTemplate?.length) {
        setPendingDemo(result);
        return;
      }

      onComplete(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось обработать фото");
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.size > 0);
    if (list.length === 0) return;
    if (list.length === 1) {
      await handleFile(list[0]);
      return;
    }

    setLoading(true);
    setError(null);
    setLastMode(null);
    setPendingDemo(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(list[0]));

    try {
      const merged: PhotoRecognitionResult["detected"] = [];
      let lastResult: PhotoRecognitionResult | null = null;
      let mode: "ai" | "demo" = "demo";

      for (const file of list) {
        if (file.size > MAX_CLIENT_BYTES) {
          throw new ApiError(`«${file.name}» больше 8 МБ`, 400);
        }
        const result = await uploadOne(file);
        lastResult = result;
        if (result.recognition?.mode === "ai") mode = "ai";
        for (const d of result.detected) {
          const existing = merged.find(
            (m) => m.name.toLowerCase() === d.name.toLowerCase() && m.unit === d.unit,
          );
          if (existing) existing.qty += d.qty;
          else merged.push({ ...d });
        }
      }

      setLastMode(mode);
      if (!lastResult) return;

      const combined: PhotoRecognitionResult = {
        photoId: lastResult.photoId,
        detected: merged,
        recognition: lastResult.recognition
          ? { ...lastResult.recognition, mode }
          : {
              mode,
              modelLabel: "",
              needsOpenAiKey: mode === "demo",
            },
        demoTemplate: lastResult.demoTemplate,
      };

      if (combined.detected.length === 0 && mode === "demo" && combined.demoTemplate?.length) {
        setPendingDemo(combined);
        return;
      }

      onComplete(combined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось обработать фото");
    } finally {
      setLoading(false);
    }
  }

  function applyDemoTemplate() {
    if (!pendingDemo?.demoTemplate?.length) return;
    onComplete({
      ...pendingDemo,
      detected: pendingDemo.demoTemplate.map((d) => ({ ...d })),
    });
    setPendingDemo(null);
  }

  function startManualFromPhoto() {
    if (!pendingDemo) return;
    onComplete({
      ...pendingDemo,
      detected: [{ name: "", qty: 1, unit: "шт" }],
    });
    setPendingDemo(null);
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-sky-200/80 bg-sky-50/40 p-6 text-center">
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) void handleFiles(files);
          e.target.value = "";
        }}
      />
      <p className="mb-1 text-sm font-medium text-slate-700">
        {zone === "freezer" ? "Фото морозилки" : "Фото холодильника"}
      </p>
      <p className="mb-1 text-xs text-slate-500 leading-relaxed">
        {photoHint ??
          "Снимите полки при открытой двери. Для AI нужен ключ OpenAI в настройках."}
      </p>
      {previewUrl && (
        <div className="mx-auto mb-3 max-h-36 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Превью" className="mx-auto max-h-36 object-contain" />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          type="button"
          disabled={loading}
          onClick={() => cameraRef.current?.click()}
        >
          {loading ? "Распознаю…" : "Сфотографировать"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => galleryRef.current?.click()}
        >
          Галерея (несколько)
        </Button>
      </div>
      {lastMode === "ai" && (
        <p className="mt-2 text-xs font-medium text-emerald-700">
          ✓ Распознано AI с учётом модели холодильника
        </p>
      )}
      {lastMode === "demo" && !pendingDemo && (
        <div className="mt-3 text-left">
          <StatusBanner variant="info">
            Добавьте{" "}
            <Link href="/settings" className="font-semibold underline">
              ключ OpenAI
            </Link>{" "}
            для распознавания по фото.
          </StatusBanner>
        </div>
      )}
      {pendingDemo && (
        <div className="mt-3 space-y-2 text-left">
          <StatusBanner variant="info">
            Без ключа AI продукты не распознаются. Заполните список вручную или подставьте
            пример для правки.
          </StatusBanner>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="flex-1" onClick={() => startManualFromPhoto()}>
              Ввести вручную
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => applyDemoTemplate()}
            >
              Пример списка
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
