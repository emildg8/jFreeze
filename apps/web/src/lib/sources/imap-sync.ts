import { ImapFlow } from "imapflow";
import { getSourceCatalog } from "./detect";
import type { ImapConfig, ParsedSourceImport, StoreConnectionsMap } from "./types";

export const IMAP_MAX_MESSAGES = 50;

export function imapSinceDate(sinceDays: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - Math.max(1, Math.min(sinceDays, 365)));
  return d;
}

export function shouldImportForConnections(
  parsed: ParsedSourceImport,
  connections: StoreConnectionsMap,
): boolean {
  if (parsed.storeId === "receipt" || parsed.orders.length === 0) {
    return parsed.orders.length > 0;
  }

  const catalog = getSourceCatalog();
  const entry = catalog.find((c) => c.storeId === parsed.storeId);
  if (!entry) return true;

  const prefs = connections[entry.id];
  if (!prefs) return true;
  return prefs.enabled;
}

export function formatImapError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("auth") || lower.includes("credentials") || lower.includes("login")) {
    return "Не удалось войти в почту. Проверьте email и пароль приложения.";
  }
  if (lower.includes("timeout") || lower.includes("etimedout")) {
    return "Таймаут подключения к IMAP. Проверьте хост, порт и интернет.";
  }
  if (lower.includes("certificate") || lower.includes("tls")) {
    return "Ошибка TLS. Для порта 993 включите SSL/TLS.";
  }
  if (lower.includes("enotfound") || lower.includes("getaddrinfo")) {
    return "Сервер IMAP не найден. Проверьте имя хоста.";
  }

  return `Ошибка IMAP: ${msg.slice(0, 200)}`;
}

export interface FetchedImapMessage {
  eml: string;
  subject?: string;
  from?: string;
}

/** Домены отправителей включённых магазинов — для ускорения поиска */
export function buildImapFromDomains(
  connections: StoreConnectionsMap,
): string[] {
  const catalog = getSourceCatalog();
  const domains = new Set<string>();

  const enabledIds = catalog
    .filter((e) => connections[e.id]?.enabled)
    .map((e) => e.id);
  const useAll = enabledIds.length === 0;

  for (const entry of catalog) {
    if (!useAll && !connections[entry.id]?.enabled) continue;

    for (const fragment of entry.emailFrom) {
      const norm = fragment.toLowerCase().trim();
      if (norm.startsWith("@")) {
        domains.add(norm.slice(1));
      } else if (norm.includes("@")) {
        domains.add(norm.split("@").pop()!);
      } else if (norm.includes(".")) {
        domains.add(norm);
      }
    }
  }

  return [...domains];
}

export async function fetchImapOrderEmails(
  config: ImapConfig,
  connections: StoreConnectionsMap = {},
): Promise<FetchedImapMessage[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.tls,
    auth: {
      user: config.user.trim(),
      pass: config.password,
    },
    logger: false,
    connectionTimeout: 30000,
  });

  const results: FetchedImapMessage[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock(config.mailbox || "INBOX");
    try {
      const since = imapSinceDate(config.sinceDays);
      const domains = buildImapFromDomains(connections);
      const searchQuery =
        domains.length > 0
          ? {
              since,
              or: domains.map((domain) => ({ from: domain })),
            }
          : { since };

      const uids = await client.search(searchQuery, { uid: true });
      const list = uids === false ? [] : [...uids];
      const slice = list.slice(-IMAP_MAX_MESSAGES);

      if (slice.length === 0) return results;

      for await (const msg of client.fetch(slice, { source: true, envelope: true }, { uid: true })) {
        if (!msg.source) continue;
        const fromAddr = msg.envelope?.from?.[0];
        results.push({
          eml: msg.source.toString("utf8"),
          subject: msg.envelope?.subject,
          from: fromAddr?.address,
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (e) {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    throw e;
  }

  return results;
}
