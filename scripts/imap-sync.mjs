#!/usr/bin/env node
/**
 * Авто-синхронизация IMAP (если настроен интервал в приложении).
 *
 *   node scripts/imap-sync.mjs
 *   CRON_SECRET=xxx JFREEZE_URL=http://127.0.0.1:3000 node scripts/imap-sync.mjs
 */
const base = (process.env.JFREEZE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET?.trim();

const headers = { Accept: "application/json" };
if (secret) headers.Authorization = `Bearer ${secret}`;

const res = await fetch(`${base}/api/sources/sync`, { method: "GET", headers });
const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("✗", body.error ?? res.statusText);
  process.exit(1);
}

if (body.skipped) {
  console.log("·", body.message ?? "Пропущено");
} else {
  console.log("✓", body.message ?? `Импортировано: ${body.imported ?? 0}`);
}
