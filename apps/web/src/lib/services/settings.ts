import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { userSettings } from "@/lib/db/schema";
import { GUEST_USER_ID, resolveUserScope } from "@/lib/auth/scope";
import { ensureUserWorkspace } from "@/lib/auth/user-setup";
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
  storeConnectionsJson: string | null;
  imapConfigJson: string | null;
  fridgeModel: string | null;
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
    storeConnectionsJson: (row.store_connections_json ??
      row.storeConnectionsJson) as string | null,
    imapConfigJson: (row.imap_config_json ?? row.imapConfigJson) as string | null,
    fridgeModel: (row.fridge_model ?? row.fridgeModel) as string | null,
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

/** Гостевой режим и фоновые скрипты без HTTP-сессии. */
export function getSettings(): AppSettings {
  return getSettingsForUser(GUEST_USER_ID);
}

export function getSettingsForUser(userId: string): AppSettings {
  ensureSeedData();
  const db = getDb();
  if (userId !== GUEST_USER_ID) {
    ensureUserWorkspace(userId);
  }
  let row = db.select().from(userSettings).where(eq(userSettings.id, userId)).get();
  if (!row && userId !== GUEST_USER_ID) {
    ensureUserWorkspace(userId);
    row = db.select().from(userSettings).where(eq(userSettings.id, userId)).get();
  }
  if (!row) {
    row = db.select().from(userSettings).where(eq(userSettings.id, GUEST_USER_ID)).get();
  }
  if (!row) {
    return rowToSettings({ id: GUEST_USER_ID });
  }
  return rowToSettings(row as unknown as Record<string, unknown>);
}

export async function getSettingsAsync(): Promise<AppSettings> {
  const userId = await resolveUserScope();
  return getSettingsForUser(userId);
}

export function getPublicSettings(): PublicSettings {
  return maskSettings(getSettings());
}

export async function getPublicSettingsAsync(): Promise<PublicSettings> {
  return maskSettings(await getSettingsAsync());
}

/** Ключ для Vision: свой → Pro-серверный env → нет */
export function resolveOpenAiApiKey(): string | null {
  return resolveOpenAiApiKeyForUser(GUEST_USER_ID);
}

export function resolveOpenAiApiKeyForUser(userId: string): string | null {
  const s = getSettingsForUser(userId);
  if (s.openaiApiKey?.trim()) return s.openaiApiKey.trim();
  if (s.plan === "pro" && process.env.OPENAI_API_KEY?.trim()) {
    return process.env.OPENAI_API_KEY.trim();
  }
  return null;
}

export async function updateSettingsAsync(
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
    storeConnectionsJson: string | null;
    imapConfigJson: string | null;
    fridgeModel: string | null;
  }>,
) {
  const userId = await resolveUserScope();
  updateSettingsForUser(userId, partial);
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
    storeConnectionsJson: string | null;
    imapConfigJson: string | null;
    fridgeModel: string | null;
  }>,
) {
  updateSettingsForUser(GUEST_USER_ID, partial);
}

export function updateSettingsForUser(
  userId: string,
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
    storeConnectionsJson: string | null;
    imapConfigJson: string | null;
    fridgeModel: string | null;
  }>,
) {
  ensureSeedData();
  const db = getDb();
  if (userId !== GUEST_USER_ID) ensureUserWorkspace(userId);
  const current = getSettingsForUser(userId);

  const next: AppSettings = {
    ...current,
    id: userId,
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
    storeConnectionsJson:
      partial.storeConnectionsJson !== undefined
        ? partial.storeConnectionsJson
        : current.storeConnectionsJson,
    imapConfigJson:
      partial.imapConfigJson !== undefined
        ? partial.imapConfigJson
        : current.imapConfigJson,
    fridgeModel:
      partial.fridgeModel !== undefined ? partial.fridgeModel : current.fridgeModel,
  };

  const row = db.select().from(userSettings).where(eq(userSettings.id, userId)).get();
  if (!row) {
    db.insert(userSettings).values(next).run();
  } else {
    db.update(userSettings).set(next).where(eq(userSettings.id, userId)).run();
  }
}

export function isPro(userId: string = GUEST_USER_ID): boolean {
  return getSettingsForUser(userId).plan === "pro";
}

export function canUseAiVision(): boolean {
  return resolveOpenAiApiKey() !== null;
}

export function getCartPreferences(userId: string = GUEST_USER_ID): CartPreferences {
  return parseCartPreferences(getSettingsForUser(userId).cartPreferencesJson);
}

export function saveCartPreferences(
  prefs: CartPreferences,
  userId: string = GUEST_USER_ID,
) {
  updateSettingsForUser(userId, {
    cartPreferencesJson: JSON.stringify(prefs),
  });
}

export function getLastImapSyncAt(userId: string = GUEST_USER_ID): Date | null {
  return getSettingsForUser(userId).lastImapSyncAt;
}

export async function setLastImapSyncAt(at: Date) {
  const userId = await resolveUserScope();
  ensureSeedData();
  const db = getDb();
  db.update(userSettings)
    .set({ lastImapSyncAt: at })
    .where(eq(userSettings.id, userId))
    .run();
}

export function getLastExpiryNotifyAt(): Date | null {
  return getSettings().lastExpiryNotifyAt;
}

export async function setLastExpiryNotifyAt(at: Date) {
  const userId = await resolveUserScope();
  ensureSeedData();
  const db = getDb();
  db.update(userSettings)
    .set({ lastExpiryNotifyAt: at })
    .where(eq(userSettings.id, userId))
    .run();
}
