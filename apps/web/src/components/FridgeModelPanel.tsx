"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { StatusBanner } from "./ui/StatusBanner";
import { apiFetch, ApiError } from "@/lib/api/client";
import { encodeFridgeModel } from "@/lib/fridge/fridge-model";

interface Preset {
  id: string;
  label: string;
  photoHint: string;
}

interface FridgeModelPanelProps {
  onSaved?: () => void;
}

export function FridgeModelPanel({ onSaved }: FridgeModelPanelProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState("");
  const [customName, setCustomName] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [photoHint, setPhotoHint] = useState<string | null>(null);
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const load = useCallback(async () => {
    try {
      const [modelsRes, settingsRes] = await Promise.all([
        apiFetch<{
          presets: Preset[];
          current?: { label: string; photoHint: string; isConfigured?: boolean };
          hasOpenAiKey?: boolean;
        }>("/api/fridge/models"),
        apiFetch<{ settings: { fridgeModel?: string | null } }>("/api/settings"),
      ]);
      setPresets(modelsRes.presets ?? []);
      setCurrentLabel(modelsRes.current?.label ?? null);
      setPhotoHint(modelsRes.current?.photoHint ?? null);
      setHasOpenAiKey(Boolean(modelsRes.hasOpenAiKey));
      setIsConfigured(Boolean(modelsRes.current?.isConfigured));
      setExpanded(!modelsRes.current?.isConfigured);

      const raw = settingsRes.settings?.fridgeModel ?? "";
      if (raw.startsWith("preset:")) {
        setPresetId(raw.slice("preset:".length));
        setUseCustom(false);
        setCustomName("");
      } else if (raw.startsWith("custom:")) {
        setUseCustom(true);
        setCustomName(raw.slice("custom:".length));
        setPresetId("");
      } else if (raw) {
        setUseCustom(true);
        setCustomName(raw);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    }
  }, []);

  useOnMount(() => {
    void load();
  });

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const fridgeModel = encodeFridgeModel(
        useCustom ? null : presetId || null,
        useCustom ? customName : null,
      );

      await apiFetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fridgeModel }),
      });
      setMessage("Модель сохранена — учтём при распознавании фото");
      setIsConfigured(Boolean(fridgeModel));
      setExpanded(false);
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  const selectedPreset = presets.find((p) => p.id === presetId);

  return (
    <Panel variant="accent" className="space-y-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-800">Модель холодильника</h2>
          {isConfigured && currentLabel && (
            <p className="mt-1 text-xs text-slate-600">
              Сейчас: <span className="font-medium">{currentLabel}</span>
              {hasOpenAiKey ? (
                <span className="text-emerald-700"> · AI включён</span>
              ) : (
                <span>
                  {" "}
                  ·{" "}
                  <Link href="/settings" className="text-sky-700 underline">
                    добавьте ключ OpenAI
                  </Link>
                </span>
              )}
            </p>
          )}
          {!isConfigured && (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Укажите тип — точнее распознавание по фото с ключом OpenAI.
            </p>
          )}
        </div>
        {isConfigured && (
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 py-1 text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Свернуть" : "Изменить"}
          </Button>
        )}
      </div>

      {photoHint && isConfigured && !expanded && (
        <p className="text-xs text-slate-500 leading-relaxed">📷 {photoHint}</p>
      )}

      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}

      {(!isConfigured || expanded) && (
        <>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="radio"
              checked={!useCustom}
              onChange={() => setUseCustom(false)}
            />
            Тип из каталога
          </label>
          {!useCustom && (
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              aria-label="Тип холодильника"
            >
              <option value="">— выберите —</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="radio"
              checked={useCustom}
              onChange={() => setUseCustom(true)}
            />
            Своя марка / модель
          </label>
          {useCustom && (
            <Input
              placeholder="Например: Samsung RB37, Bosch KGN39…"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              aria-label="Модель холодильника"
            />
          )}

          {selectedPreset && !useCustom && (
            <p className="text-xs text-slate-500 leading-relaxed">
              📷 {selectedPreset.photoHint}
            </p>
          )}

          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Сохранение…" : "Сохранить модель"}
          </Button>
        </>
      )}
    </Panel>
  );
}
