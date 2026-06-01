#!/usr/bin/env node
/**
 * Ежедневные напоминания (срок годности → Telegram).
 * Запуск: сервер jFreeze должен быть доступен.
 *
 *   node scripts/daily-reminders.mjs
 *   JFREEZE_URL=http://127.0.0.1:3000 node scripts/daily-reminders.mjs
 */
const base = (process.env.JFREEZE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const res = await fetch(`${base}/api/reminders/tick`, { method: "POST" });
const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("✗", body.error ?? res.statusText);
  process.exit(1);
}

console.log(
  body.expiryNotified
    ? `✓ Telegram: отправлено (${body.expiryAlertCount} позиций)`
    : `· Без отправки (алертов: ${body.expiryAlertCount ?? 0})`,
);
