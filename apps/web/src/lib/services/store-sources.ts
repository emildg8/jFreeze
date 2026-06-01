import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { orders, sourceImports, stores } from "@/lib/db/schema";
import type { StoreId } from "@/connectors/types";
import { getSourceCatalog } from "@/lib/sources/detect";
import {
  contentHash,
  importFromEmail,
  importFromSms,
  summarizeImports,
  type ParsedSourceImport,
} from "@/lib/sources/import";
import {
  DEFAULT_IMAP_CONFIG,
  type ImapConfig,
  type StoreChannelPrefs,
  type StoreConnectionsMap,
} from "@/lib/sources/types";
import { persistConnectorOrders } from "./orders";
import {
  getSettingsForUser,
  setLastImapSyncAt,
  getLastImapSyncAt,
  updateSettingsForUser,
} from "./settings";
import { GUEST_USER_ID, resolveUserScope } from "@/lib/auth/scope";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { notifyTelegramNewOrders } from "@/lib/telegram/notify";

const DEFAULT_PREFS: StoreChannelPrefs = {
  enabled: false,
  email: true,
  sms: true,
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw?.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getStoreConnections(userId: string = GUEST_USER_ID): StoreConnectionsMap {
  ensureSeedData();
  return parseJson(getSettingsForUser(userId).storeConnectionsJson, {});
}

export function saveStoreConnections(
  map: StoreConnectionsMap,
  userId: string = GUEST_USER_ID,
) {
  updateSettingsForUser(userId, {
    storeConnectionsJson: JSON.stringify(map),
  });
}

export function getImapConfig(userId: string = GUEST_USER_ID): ImapConfig {
  ensureSeedData();
  return {
    ...DEFAULT_IMAP_CONFIG,
    ...parseJson(getSettingsForUser(userId).imapConfigJson, {}),
  };
}

export function saveImapConfig(config: ImapConfig, userId: string = GUEST_USER_ID) {
  updateSettingsForUser(userId, {
    imapConfigJson: JSON.stringify(config),
  });
}

export function maskImapConfig(config: ImapConfig): ImapConfig & { hasPassword: boolean } {
  return {
    ...config,
    password: config.password ? "••••••••" : "",
    hasPassword: Boolean(config.password?.trim()),
  };
}

function isImportDuplicate(hash: string): boolean {
  const db = getDb();
  return (
    db.select().from(sourceImports).where(eq(sourceImports.contentHash, hash)).all()
      .length > 0
  );
}

function orderExternalExists(externalId: string): boolean {
  const db = getDb();
  return db.select().from(orders).where(eq(orders.externalId, externalId)).all().length > 0;
}

function logImport(hash: string, channel: string, storeId: string, orderIds: string[]) {
  const db = getDb();
  db.insert(sourceImports)
    .values({
      contentHash: hash,
      channel,
      storeId,
      orderIdsJson: JSON.stringify(orderIds),
      importedAt: new Date(),
    })
    .run();
}

function markStoreConnected(storeId: string) {
  const db = getDb();
  db.update(stores)
    .set({ connectedAt: new Date(), availability: "active" })
    .where(eq(stores.id, storeId))
    .run();
}

async function filterNewOrders(
  storeId: StoreId,
  parsed: ParsedSourceImport[],
  contentKey: string,
  options?: { notifyTelegram?: boolean; userId?: string },
) {
  const userId = options?.userId ?? GUEST_USER_ID;
  const hash = contentHash(contentKey);
  if (isImportDuplicate(hash)) {
    return {
      imported: 0,
      skipped: true,
      message: "Это сообщение уже импортировано",
      parsed,
    };
  }

  const toSave: ParsedSourceImport[] = [];
  for (const p of parsed) {
    const newOrders = p.orders.filter((o) => !orderExternalExists(o.externalId));
    if (newOrders.length > 0) {
      toSave.push({ ...p, orders: newOrders });
    }
  }

  const allOrders = toSave.flatMap((p) => p.orders);
  if (allOrders.length === 0) {
    return {
      imported: 0,
      skipped: true,
      message: "Новых заказов нет (дубликаты)",
      parsed,
    };
  }

  let totalCreated = 0;
  const createdIds: string[] = [];
  for (const p of toSave) {
    const created = await persistConnectorOrders(p.storeId, p.orders, {
      notifyTelegram: options?.notifyTelegram,
      userId,
    });
    totalCreated += created.length;
    createdIds.push(...created);
    if (created.length > 0) markStoreConnected(p.storeId);
  }

  logImport(hash, parsed[0]?.channel ?? "email", storeId, createdIds);

  return {
    imported: totalCreated,
    skipped: false,
    message: `Импортировано заказов: ${totalCreated}`,
    parsed,
    warnings: parsed.flatMap((p) => p.warnings ?? []),
  };
}

export async function processEmailImport(options: {
  text?: string;
  eml?: string;
  storeId?: StoreId;
  autoImport?: boolean;
  notifyTelegram?: boolean;
  userId?: string;
}) {
  const userId = options.userId ?? (await resolveUserScope());
  const parsed = importFromEmail({
    raw: options.text,
    eml: options.eml,
    forcedStoreId: options.storeId,
  });

  if (!options.autoImport) {
    return { preview: parsed, imported: 0 };
  }

  const key = options.eml ?? options.text ?? "";
  const result = await filterNewOrders(parsed.storeId, [parsed], key, {
    notifyTelegram: options.notifyTelegram,
    userId,
  });
  return { ...result, preview: parsed };
}

export async function processSmsImport(options: {
  text: string;
  storeId?: StoreId;
  autoImport?: boolean;
  userId?: string;
}) {
  const userId = options.userId ?? (await resolveUserScope());
  const parsedList = importFromSms(options.text, options.storeId);
  const summary = summarizeImports(parsedList);

  if (!options.autoImport) {
    return { preview: parsedList, imported: 0, ...summary };
  }

  const storeId = (parsedList[0]?.storeId ?? "receipt") as StoreId;
  const result = await filterNewOrders(storeId, parsedList, options.text, { userId });
  return { ...result, preview: parsedList, ...summary };
}

export function listSourcesState(userId: string = GUEST_USER_ID) {
  const catalog = getSourceCatalog();
  const connections = getStoreConnections(userId);
  const imap = maskImapConfig(getImapConfig(userId));

  const items = catalog.map((entry) => {
    const prefs = connections[entry.id] ?? { ...DEFAULT_PREFS };
    return {
      ...entry,
      prefs,
    };
  });

  const lastImapSyncAt = getLastImapSyncAt(userId);

  return {
    catalog: items,
    connections,
    imap,
    lastImapSyncAt: lastImapSyncAt?.toISOString() ?? null,
  };
}

export async function maybeRunImapAutoSync(userId?: string): Promise<{
  imported: number;
  scanned: number;
  skipped: number;
  message: string;
} | null> {
  const uid = userId ?? (await resolveUserScope());
  const { isImapAutoSyncDue } = await import("@/lib/sources/imap-schedule");
  const cfg = getImapConfig(uid);
  if (!isImapAutoSyncDue(cfg)) return null;
  return syncImapInbox(uid);
}

export async function syncImapInbox(userId?: string): Promise<{
  imported: number;
  scanned: number;
  skipped: number;
  message: string;
}> {
  const uid = userId ?? (await resolveUserScope());
  const cfg = getImapConfig(uid);
  if (!cfg.enabled || !cfg.user?.trim()) {
    return {
      imported: 0,
      scanned: 0,
      skipped: 0,
      message:
        "IMAP выключен. Включите авто-проверку и укажите почту в разделе «Источники».",
    };
  }

  if (!cfg.password?.trim()) {
    return {
      imported: 0,
      scanned: 0,
      skipped: 0,
      message: "Укажите пароль приложения и нажмите «Сохранить».",
    };
  }

  const {
    fetchImapOrderEmails,
    formatImapError,
    shouldImportForConnections,
  } = await import("@/lib/sources/imap-sync");

  let emails;
  try {
    emails = await fetchImapOrderEmails(cfg, getStoreConnections(uid));
  } catch (e) {
    return {
      imported: 0,
      scanned: 0,
      skipped: 0,
      message: formatImapError(e),
    };
  }

  const connections = getStoreConnections(uid);
  let imported = 0;
  let skipped = 0;
  const importedByStore: Record<string, number> = {};

  for (const { eml } of emails) {
    const preview = importFromEmail({ eml });
    if (!shouldImportForConnections(preview, connections)) {
      skipped += 1;
      continue;
    }

    const result = await processEmailImport({
      eml,
      autoImport: true,
      notifyTelegram: false,
      userId: uid,
    });
    const n = result.imported ?? 0;
    imported += n;
    if (n > 0) {
      importedByStore[preview.storeId] = (importedByStore[preview.storeId] ?? 0) + n;
    }
    if ("skipped" in result && result.skipped) skipped += 1;
  }

  if (isTelegramConfigured()) {
    for (const [storeId, count] of Object.entries(importedByStore)) {
      void notifyTelegramNewOrders(count, storeId);
    }
  }

  await setLastImapSyncAt(new Date());

  const scanned = emails.length;
  const message =
    imported > 0
      ? `Проверено писем: ${scanned}. Импортировано заказов: ${imported}.`
      : scanned > 0
        ? `Проверено писем: ${scanned}. Новых заказов не найдено.`
        : `В ящике «${cfg.mailbox}» нет писем за последние ${cfg.sinceDays} дн.`;

  return { imported, scanned, skipped, message };
}
