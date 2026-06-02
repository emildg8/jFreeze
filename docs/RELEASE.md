# Релиз jFreeze pre-alpha

Текущая версия: **0.2.7-pre-alpha** (единый источник: [VERSION](../VERSION)).

## Перед публикацией

```bash
npm ci
npm run verify
```

Проходят: lint, 73+ unit-тестов, production build, 8 e2e.

## Ветка и тег

```bash
# VERSION и apps/web/package.json уже совпадают
npm run verify
git tag -a v0.2.6-pre-alpha -m "jFreeze 0.2.6-pre-alpha"
git push origin main
git push origin v0.2.6-pre-alpha
gh release create v0.2.6-pre-alpha --title "jFreeze 0.2.6-pre-alpha" --notes-file CHANGELOG-snippet.md
```

## Установка (пользователи)

```bash
git clone https://github.com/emildg8/jFreeze.git
cd jFreeze
npm install
cp apps/web/.env.example apps/web/.env.local
# AUTH_SECRET=…  см. docs/AUTH.md
npm run dev
```

http://localhost:3000

## Production (веб)

```bash
npm run build
cd apps/web
node .next/standalone/apps/web/server.js
```

Переменные: `apps/web/.env.example`

## Опциональные ключи (BYOK в UI или env)

| Сервис | Настройки / env |
|--------|------------------|
| OpenAI Vision (фото холодильника) | Настройки → OpenAI · `OPENAI_API_KEY` |
| Proverka Cheka (детальный ОФД) | Настройки → ОФД · `PROVERKA_CHEKA_TOKEN` |
| Telegram-бот | `TELEGRAM_BOT_TOKEN`, `PUBLIC_APP_URL` |

## Планировщик (cron)

| Задача | Команда |
|--------|---------|
| Срок годности → Telegram | `npm run reminders:daily` |
| IMAP | `npm run imap:sync` |

С `CRON_SECRET`: `GET /api/sources/sync`, `POST /api/reminders/tick`.

## Платформы

| Платформа | Документ |
|-----------|----------|
| Web / PWA | README |
| Windows | [PLATFORMS.md](./PLATFORMS.md) |
| Android / iOS | [MOBILE.md](./MOBILE.md) |
| Telegram | [TELEGRAM_BOT.md](./TELEGRAM_BOT.md) |
| Chrome | [BROWSER_EXTENSION.md](./BROWSER_EXTENSION.md) |

## Веха 0.2.6 (итог цикла pre-alpha 0.2)

См. [CHANGELOG.md](../CHANGELOG.md#026-pre-alpha--2026-06-01).

- **Аккаунт** — заказы, холодильник, корзина, IMAP по `userId`
- **Холодильник** — модель, фото (OpenAI / ручной ввод), несколько снимков, сроки при сохранении
- **Telegram** — лента → холодильник или чек ОФД из подписи
- **Заказы** — QR ОФД, «в холодильник», IMAP, экспорт

## GitHub Release (шаблон)

**jFreeze 0.2.6-pre-alpha** — умный холодильник и заказы для РФ.

- Веб/PWA, Windows, Android, iOS, Telegram
- Цикл: заказы → холодильник → корзина → семья
- Импорт: CSV, чеки, QR ОФД, IMAP, Telegram-фото
- Бесплатный стек; OpenAI и Proverka — BYOK

`npm run verify` перед деплоем.
