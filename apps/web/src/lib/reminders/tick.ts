import { listExpiryAlerts } from "@/lib/services/expiry";
import {
  getLastExpiryNotifyAt,
  getSettings,
  setLastExpiryNotifyAt,
} from "@/lib/services/settings";
import { isTelegramConfigured } from "@/lib/telegram/config";
import { notifyTelegramExpiryForActiveProfile } from "@/lib/telegram/notify";

const EXPIRY_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 ч — не чаще раза в день

export interface RemindersTickResult {
  expiryNotified: boolean;
  expiryAlertCount: number;
}

/** Фоновые напоминания (вызывается при открытии приложения / cron) */
export async function runRemindersTick(): Promise<RemindersTickResult> {
  const result: RemindersTickResult = {
    expiryNotified: false,
    expiryAlertCount: 0,
  };

  if (!isTelegramConfigured() || !getSettings().expiryRemindersEnabled) {
    return result;
  }

  const alerts = listExpiryAlerts(7);
  result.expiryAlertCount = alerts.length;
  if (alerts.length === 0) return result;

  const last = getLastExpiryNotifyAt();
  if (last && Date.now() - last.getTime() < EXPIRY_COOLDOWN_MS) {
    return result;
  }

  await notifyTelegramExpiryForActiveProfile();
  setLastExpiryNotifyAt(new Date());
  result.expiryNotified = true;
  return result;
}
