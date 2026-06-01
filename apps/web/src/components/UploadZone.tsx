"use client";

import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { Button } from "./ui/Button";

interface UploadZoneProps {
  zone: "fridge" | "freezer";
  onComplete: (data: {
    photoId: string;
    detected: Array<{ name: string; qty: number; unit: string }>;
  }) => void;
}

export function UploadZone({ zone, onComplete }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("zone", zone);
      const res = await fetch("/api/fridge/photo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error ?? "Ошибка", res.status);
      onComplete({
        photoId: data.photoId,
        detected: (data.detected ?? []).map(
          (d: { name: string; qty: number; unit: string }) => ({
            name: d.name,
            qty: d.qty,
            unit: d.unit,
          }),
        ),
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
        }}
      />
      <p className="mb-1 text-sm font-medium text-slate-700">
        {zone === "freezer" ? "Морозилка" : "Холодильник"}
      </p>
      <p className="mb-3 text-xs text-slate-500">
        AI (Pro или свой ключ) или быстрый список для правки
      </p>
      <Button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Обработка…" : "Выбрать фото"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
