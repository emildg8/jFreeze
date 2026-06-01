# jFreeze — pre-alpha 0.2

[![CI](https://github.com/emildg8/jFreeze/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/emildg8/jFreeze/actions/workflows/ci.yml)

> Умный холодильник, история заказов, корзина, семья, Telegram.  
> **Платформы:** Web/PWA · Windows · Android · iOS · Telegram · **расширение Chrome**.

> Инструменты: [docs/FREE_STACK.md](docs/FREE_STACK.md) · Платформы: [docs/PLATFORMS.md](docs/PLATFORMS.md) · **Релиз:** [docs/RELEASE.md](docs/RELEASE.md)

## Быстрый старт (веб)

```bash
git clone https://github.com/emildg8/jFreeze.git
cd jFreeze
npm install
cp apps/web/.env.example apps/web/.env.local
# AUTH_SECRET=…  см. docs/AUTH.md
npm run dev
```

http://localhost:3000

## Проверка перед релизом

```bash
npm run verify
```

Lint · unit · production build · e2e smoke.

## Платформы

| Канал | Команда / документ |
|-------|-------------------|
| **Веб / PWA** | `npm run dev` |
| **Windows** | `npm run build:desktop` → `apps/desktop` → `npm run dist` |
| **Android / iOS** | [docs/MOBILE.md](docs/MOBILE.md) |
| **Telegram** | [docs/TELEGRAM_BOT.md](docs/TELEGRAM_BOT.md) |
| **Chrome / Edge** | [docs/BROWSER_EXTENSION.md](docs/BROWSER_EXTENSION.md) |

В приложении: **Ещё → Все платформы**.

## Функции (0.2)

| Область | Возможности |
|---------|-------------|
| **Заказы** | Демо, CSV, чеки, **QR ОФД**, **в холодильник из заказа**, IMAP, экспорт Excel |
| **Аналитика** | Расходы за 7 дней и **по категориям** на главной |
| **Холодильник** | Модель в настройках, **распознавание по фото** (OpenAI), фото/штрихкод, сроки, план полок |
| **Корзина** | Умный подбор, «Купил → в холодильник», AI (BYOK), шаринг |
| **Семья** | Профили, Telegram-лента файлов |
| **Аккаунт** | Вход: телефон, почта, Google, Apple — [docs/AUTH.md](docs/AUTH.md) |
| **Фон** | `npm run reminders:daily` · `npm run imap:sync` |

Документы: [INTEGRATIONS.md](docs/INTEGRATIONS.md) · [IMAP.md](docs/IMAP.md) · [OFD.md](docs/OFD.md)

## Cron / сервер

```bash
# Telegram: срок годности (сервер должен быть запущен)
npm run reminders:daily

# Почта IMAP (если настроен интервал в «Источники»)
npm run imap:sync
```

Опционально: `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `PROVERKA_CHEKA_TOKEN` — см. `apps/web/.env.example`.

## Архитектура

| Слой | Путь |
|------|------|
| UI | `apps/web/src/app/*` |
| API | `apps/web/src/app/api/*` |
| Desktop | `apps/desktop/` (Electron) |
| Расширение | `extensions/browser/` |
| Данные | SQLite `apps/web/data/jfreeze.db` |

## Версии

| Версия | Ветка |
|--------|--------|
| **0.2.6-pre-alpha** (текущая) | `main` |
| 0.2.4-pre-alpha | [v0.2.4-pre-alpha](https://github.com/emildg8/jFreeze/releases/tag/v0.2.4-pre-alpha) |
| 0.2.1-pre-alpha | [v0.2.1-pre-alpha](https://github.com/emildg8/jFreeze/releases/tag/v0.2.1-pre-alpha) |
| 0.1.0-pre-alpha | `release/pre-alpha-0.1` |

Последний релиз: [v0.2.6-pre-alpha](https://github.com/emildg8/jFreeze/releases/tag/v0.2.6-pre-alpha) · [CHANGELOG.md](CHANGELOG.md)

## Лицензия

MIT
