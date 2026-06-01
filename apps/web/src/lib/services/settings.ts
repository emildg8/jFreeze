import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { userSettings } from "@/lib/db/schema";
import {
  parseCartPreferences,
  type CartPreferences,
} from "@/lib/cart/preferences";

export type Plan = "free" | "pro";

export interface AppSettings {
  id: string;
  locale: string;
  minQtyThreshold: number;
  historyDays: number;
  onboardingDone: boolean;
  openaiApiKey: string | null;
  expiryRemindersEnabled: boolean;
  pushEnabled: boolean;
  activeProfileId: string;
  plan: Plan;
  smartFridgeUrl: string | null;
  smartFridgeToken: string | null;
  cartPreferencesJson: string | null;
  lastImapSyncAt: Date | null;
  lastExpiryNotifyAt: Date | null;
}

export type PublicSettings = Omit<
  AppSettings,
  "openaiApiKey" | "smartFridgeToken"
> & {
  openaiApiKey: string | null;
  smartFridgeToken: string | null;
  hasOpenAiKey: boolean;
  hasSmartFridgeToken: boolean;
};

function parsePlan(value: unknown): Plan {
  return value === "pro" ? "pro" : "free";
}

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    id: String(row.id ?? "default"),
    locale: String(row.locale ?? "ru"),
    minQtyThreshold: Number(row.min_qty_threshold ?? row.minQtyThreshold ?? 1),
    historyDays: Number(row.history_days ?? row.historyDays ?? 90),
    onboardingDone: Boolean(row.onboarding_done ?? row.onboardingDone),
    openaiApiKey: (row.openai_api_key ?? row.openaiApiKey) as string | null,
    expiryRemindersEnabled: Boolean(
      row.expiry_reminders_enabled ?? row.expiryRemindersEnabled ?? true,
    ),
    pushEnabled: Boolean(row.push_enabled ?? row.pushEnabled ?? false),
    activeProfileId: String(
      row.active_profile_id ?? row.activeProfileId ?? "default",
    ),
    plan: parsePlan(row.plan),
    smartFridgeUrl: (row.smart_fridge_url ?? row.smartFridgeUrl) as string | null,
    smartFridgeToken: (row.smart_fridge_token ??
      row.smartFridgeToken) as string | null,
    cartPreferencesJson: (row.cart_preferences_json ??
      row.cartPreferencesJson) as string | null,
    lastImapSyncAt: parseOptionalTimestamp(
      row.last_imap_sync_at ?? row.lastImapSyncAt,
    ),
    lastExpiryNotifyAt: parseOptionalTimestamp(
      row.last_expiry_notify_at ?? row.lastExpiryNotifyAt,
    ),
  };
}

function parseOptionalTimestamp(value: unknown): Date | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n);
}

export function maskSettings(settings: AppSettings): PublicSettings {
  return {
    ...settings,
    openaiApiKey: settings.openaiApiKey ? "••••••••" : null,
    smartFridgeToken: settings.smartFridgeToken ? "••••••••" : null,
    hasOpenAiKey: Boolean(settings.openaiApiKey?.trim()),
    hasSmartFridgeToken: Boolean(settings.smartFridgeToken?.trim()),
  };
}

export function getSettings(): AppSettings {
  ensureSeedData();
  const db = getDb();
  const row = db.select().from(userSettings).all()[0];
  if (!row) {
    return rowToSettings({ id: "default" });
  }
  return rowToSettings(row as unknown as Record<string, unknown>);
}

export function getPublicSettings(): PublicSettings {
  return maskSettings(getSettings());
}

/** Ключ для Vision: свой → Pro-серверный env → нет */
export function resolveOpenAiApiKey(): string | null {
  const s = getSettings();
  if (s.openaiApiKey?.trim()) return s.openaiApiKey.trim();
  if (s.plan === "pro" && process.env.OPENAI_API_KEY?.trim()) {
    return process.env.OPENAI_API_KEY.trim();
  }
  return null;
}

export function updateSettings(
  partial: Partial<{
    minQtyThreshold: number;
    historyDays: number;
    onboardingDone: boolean;
    openaiApiKey: string | null;
    expiryRemindersEnabled: boolean;
    pushEnabled: boolean;
    activeProfileId: string;
    plan: Plan;
    smartFridgeUrl: string | null;
    smartFridgeToken: string | null;
    cartPreferencesJson: string | null;
  }>,
) {
  ensureSeedData();
  const db = getDb();
  const current = getSettings();

  const next: AppSettings = {
    ...current,
    minQtyThreshold: partial.minQtyThreshold ?? current.minQtyThreshold,
    historyDays: partial.historyDays ?? current.historyDays,
    onboardingDone: partial.onboardingDone ?? current.onboardingDone,
    openaiApiKey:
      partial.openaiApiKey !== undefined
        ? partial.openaiApiKey
        : current.openaiApiKey,
    expiryRemindersEnabled:
      partial.expiryRemindersEnabled ?? current.expiryRemindersEnabled,
    pushEnabled: partial.pushEnabled ?? current.pushEnabled,
    activeProfileId: partial.activeProfileId ?? current.activeProfileId,
    plan: partial.plan ?? current.plan,
    smartFridgeUrl:
      partial.smartFridgeUrl !== undefined
        ? partial.smartFridgeUrl
        : current.smartFridgeUrl,
    smartFridgeToken:
      partial.smartFridgeToken !== undefined
        ? partial.smartFridgeToken
        : current.smartFridgeToken,
    cartPreferencesJson:
      partial.cartPreferencesJson !== undefined
        ? partial.cartPreferencesJson
        : current.cartPreferencesJson,
  };

  const rows = db.select().from(userSettings).all();
  if (rows.length === 0) {
    db.insert(userSettings).values(next).run();
  } else {
    db.update(userSettings).set(next).where(eq(userSettings.id, "default")).run();
  }
}

export function isPro(): boolean {
  return getSettings().plan === "pro";
}

export function canUseAiVision(): boolean {
  return resolveOpenAiApiKey() !== null;
}

export function getCartPreferences(): CartPreferences {
  return parseCartPreferences(getSettings().cartPreferencesJson);
}

export function saveCartPreferences(prefs: CartPreferences) {
  updateSettings({
    cartPreferencesJson: JSON.stringify(prefs),
  });
}

export function getLastImapSyncAt(): Date | null {
  return getSettings().lastImapSyncAt;
}

export function setLastImapSyncAt(at: Date) {
  ensureSeedData();
  const db = getDb();
  db.update(userSettings)
    .set({ lastImapSyncAt: at })
    .where(eq(userSettings.id, "default"))
    .run();
}

export function getLastExpiryNotifyAt(): Date | null {
  return getSettings().lastExpiryNotifyAt;
}

export function setLastExpiryNotifyAt(at: Date) {
  ensureSeedData();
  const db = getDb();
  db.update(userSettings)
    .set({ lastExpiryNotifyAt: at })
    .where(eq(userSettings.id, "default"))
    .run();
}
