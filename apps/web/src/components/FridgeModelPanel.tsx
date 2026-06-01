"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { StatusBanner } from "./ui/StatusBanner";
import { apiFetch, ApiError } from "@/lib/api/client";

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

  const load = useCallback(async () => {
    try {
      const [presetsRes, settingsRes] = await Promise.all([
        apiFetch<{ presets: Preset[] }>("/api/fridge/models"),
        apiFetch<{ settings: { fridgeModel?: string | null } }>("/api/settings"),
      ]);
      setPresets(presetsRes.presets ?? []);
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
      const fridgeModel = useCustom
        ? customName.trim()
          ? `custom:${customName.trim()}`
          : null
        : presetId
          ? `preset:${presetId}`
          : null;

      await apiFetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fridgeModel }),
      });
      setMessage("Модель сохранена — учтём при распознавании фото");
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
      <div>
        <h2 className="font-semibold text-slate-800">Модель холодильника</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Укажите тип или марку — AI точнее распознает продукты на фото. Без ключа OpenAI
          покажем демо-список для правки.
        </p>
      </div>

      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {message && <StatusBanner variant="success">{message}</StatusBanner>}

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
    </Panel>
  );
}
