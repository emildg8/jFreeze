# Релиз jFreeze pre-alpha

Текущая версия: **0.2.0-pre-alpha** (см. [VERSION](../VERSION)).

## Перед публикацией

```bash
npm ci
npm run verify
```

Должны пройти: lint, 44+ unit-тестов, production build, 5 e2e.

## Ветка и тег

```bash
git checkout -b release/pre-alpha-0.2
git add -A
git commit -m "release: pre-alpha 0.2.0"
git tag -a v0.2.0-pre-alpha -m "jFreeze pre-alpha 0.2.0"
git push -u origin release/pre-alpha-0.2
git push origin v0.2.0-pre-alpha
```

## Установка (пользователи)

```bash
git clone https://github.com/emildg8/jFreeze.git
cd jFreeze
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Открыть http://localhost:3000

## Production (веб)

```bash
npm run build
cd apps/web
node .next/standalone/apps/web/server.js
# или npm run start (см. предупреждение standalone в логах)
```

Переменные: `apps/web/.env.example`

## Планировщик (cron)

При запущенном сервере:

| Задача | Команда |
|--------|---------|
| Срок годности → Telegram | `npm run reminders:daily` |
| IMAP (если включён интервал) | `npm run imap:sync` |

С `CRON_SECRET` в `.env.local`:

```bash
CRON_SECRET=ваш_секрет JFREEZE_URL=https://your-host npm run imap:sync
```

API: `POST /api/reminders/tick`, `GET /api/sources/sync` (с `Authorization: Bearer CRON_SECRET`).

## Платформы

| Платформа | Документ |
|-----------|----------|
| Web / PWA | README |
| Windows | [PLATFORMS.md](./PLATFORMS.md) |
| Android / iOS | [MOBILE.md](./MOBILE.md) |
| Telegram | [TELEGRAM_BOT.md](./TELEGRAM_BOT.md) |

## Что нового в 0.2.0

См. [CHANGELOG.md](../CHANGELOG.md#020-pre-alpha--2026-06-01).

Кратко: IMAP, QR ОФД, Telegram-напоминания, 5 платформ, экспорт Excel, источники почта/SMS, стабильный monorepo dev.

## GitHub Release (текст)

**jFreeze 0.2.0-pre-alpha** — умный холодильник и заказы для РФ.

- Веб/PWA, Windows, Android, iOS, Telegram
- Импорт: демо, CSV, чеки, QR ОФД, почта, SMS, IMAP
- Умная корзина, срок годности, семейные профили
- Бесплатный стек; OpenAI и Proverkacheka — опционально (BYOK)

`npm run verify` перед деплоем. Обратная связь — Issues на GitHub.
