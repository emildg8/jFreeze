/**
 * Локальный long-polling → webhook jFreeze (без публичного URL).
 * Запуск: из apps/web с TELEGRAM_BOT_TOKEN и npm run dev
 */
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const base =
  process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

if (!token) {
  console.error("Задайте TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

let offset = 0;
console.log(`Telegram poll → ${base}/api/telegram/webhook`);

async function loop() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?timeout=25&offset=${offset}`,
    );
    const data = await res.json();
    if (!data.ok) {
      console.error(data.description ?? data);
      await sleep(5000);
      return loop();
    }
    for (const update of data.result ?? []) {
      offset = update.update_id + 1;
      await fetch(`${base}/api/telegram/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    }
  } catch (e) {
    console.error(e.message ?? e);
    await sleep(3000);
  }
  return loop();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

loop();
