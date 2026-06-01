import { NextResponse } from "next/server";
import {
  listFridgeModelPresets,
  parseFridgeModel,
} from "@/lib/fridge/fridge-model";
import { resolveUserScope } from "@/lib/auth/scope";
import {
  getSettingsForUser,
  resolveOpenAiApiKeyForUser,
} from "@/lib/services/settings";

export async function GET() {
  const userId = await resolveUserScope();
  const settings = getSettingsForUser(userId);
  const model = parseFridgeModel(settings.fridgeModel);
  const hasOpenAiKey = Boolean(resolveOpenAiApiKeyForUser(userId));

  return NextResponse.json({
    presets: listFridgeModelPresets(),
    current: {
      label: model.label,
      photoHint: model.photoHint,
      layoutType: model.layoutType,
      isConfigured: Boolean(settings.fridgeModel?.trim()),
    },
    hasOpenAiKey,
  });
}
