import type { ImapConfig } from "./types";
import { getLastImapSyncAt } from "@/lib/services/settings";

export function isImapAutoSyncDue(
  config: ImapConfig & { autoSyncIntervalHours?: number },
): boolean {
  const hours = config.autoSyncIntervalHours ?? 0;
  if (!config.enabled || hours <= 0) return false;
  if (!config.user?.trim() || !config.password?.trim()) return false;

  const last = getLastImapSyncAt();
  if (!last) return true;

  const elapsedMs = Date.now() - last.getTime();
  return elapsedMs >= hours * 60 * 60 * 1000;
}
