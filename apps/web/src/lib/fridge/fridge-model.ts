import presets from "@/data/fridge-models.ru.json";

export type FridgeLayoutType =
  | "top-freezer"
  | "bottom-freezer"
  | "side-by-side"
  | "single"
  | "french-door"
  | "compact"
  | "built-in"
  | "unknown";

export interface FridgeModelPreset {
  id: string;
  label: string;
  layoutType: FridgeLayoutType;
  photoHint: string;
  layoutTips: string[];
}

export interface ParsedFridgeModel {
  presetId: string | null;
  customName: string | null;
  label: string;
  layoutType: FridgeLayoutType;
  photoHint: string;
  layoutTips: string[];
}

const PRESETS = presets as FridgeModelPreset[];

export function listFridgeModelPresets(): FridgeModelPreset[] {
  return PRESETS;
}

export function parseFridgeModel(raw: string | null | undefined): ParsedFridgeModel {
  const fallback: ParsedFridgeModel = {
    presetId: null,
    customName: null,
    label: "Не указана",
    layoutType: "unknown",
    photoHint: "Сфотографируйте полки при хорошем освещении, фронтально.",
    layoutTips: [],
  };

  const value = raw?.trim();
  if (!value) return fallback;

  if (value.startsWith("preset:")) {
    const id = value.slice("preset:".length);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      return {
        presetId: preset.id,
        customName: null,
        label: preset.label,
        layoutType: preset.layoutType,
        photoHint: preset.photoHint,
        layoutTips: preset.layoutTips,
      };
    }
  }

  if (value.startsWith("custom:")) {
    const name = value.slice("custom:".length).trim();
    return {
      presetId: null,
      customName: name || null,
      label: name || "Своя модель",
      layoutType: "unknown",
      photoHint: `Холодильник: ${name}. Снимайте каждую полку отдельно.`,
      layoutTips: [],
    };
  }

  return {
    presetId: null,
    customName: value,
    label: value,
    layoutType: "unknown",
    photoHint: `Холодильник: ${value}. Снимайте полки при открытой двери.`,
    layoutTips: [],
  };
}

export function encodeFridgeModel(
  presetId: string | null,
  customName: string | null,
): string | null {
  if (presetId) return `preset:${presetId}`;
  const name = customName?.trim();
  if (name) return `custom:${name}`;
  return null;
}

export interface FridgeVisionContext {
  model: ParsedFridgeModel;
  promptExtra: string;
}

export function buildFridgeVisionContext(
  fridgeModelRaw: string | null | undefined,
): FridgeVisionContext {
  const model = parseFridgeModel(fridgeModelRaw);
  const parts = [
    `Модель/тип: ${model.label}.`,
    model.photoHint,
    "Учитывай упаковки, банки, лотки, овощи в контейнерах.",
    "Если продукт не уверен — не включай. Оцени количество по виду.",
  ];
  return { model, promptExtra: parts.join(" ") };
}
