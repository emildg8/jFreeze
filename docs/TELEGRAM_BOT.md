# Telegram-бот jFreeze

Бесплатный [Bot API](https://core.telegram.org/bots/api): уведомления и обмен фото/файлами между членами семьи.

## Возможности

| Функция | Описание |
|---------|----------|
| Привязка чата | Код из приложения → `/link AB12CD` в боте |
| Семейная лента | Фото и документы в бот → **в холодильник** или **чек ОФД** (QR в подписи) в приложении |
| Уведомления | Срок годности, новые заказы, новые файлы в ленте |
| Команды | `/fridge`, `/orders`, `/files`, `/profile`, `/notify` |

Несколько человек: каждый получает свой код в **Семья → Telegram** (или один код на общий чат).

## Настройка

1. [@BotFather](https://t.me/BotFather) → `/newbot` → скопируйте токен.
2. `apps/web/.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_BOT_USERNAME=my_jfreeze_bot
PUBLIC_APP_URL=http://localhost:3000
```

3. Перезапустите `npm run dev`.

### Локальная разработка (polling)

В двух терминалах:

```bash
cd apps/web && npm run dev
cd apps/web && npm run bot:telegram
```

Polling пересылает обновления на `POST /api/telegram/webhook`.

### Продакшен (webhook)

HTTPS URL:

```text
https://ваш-домен/api/telegram/webhook
```

Опционально `TELEGRAM_WEBHOOK_SECRET` — тот же secret в `setWebhook` у Telegram.

## API

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/telegram/link` | Статус, список чатов |
| POST | `/api/telegram/link` | Новый код привязки |
| POST | `/api/telegram/webhook` | Обновления от Telegram |
| GET | `/api/telegram/inbox` | Лента файлов |
| GET | `/api/telegram/inbox/:id` | Скачать файл |
| POST | `/api/telegram/inbox/:id/import` | `{ "action": "fridge", "zone": "fridge" }` или `{ "action": "receipt" }` |
| POST | `/api/telegram/notify` | Отправить сроки годности в TG |

## Команды бота

```
/start, /help
/link КОД
/fridge
/orders
/files
/profile [id]
/notify [expiry|orders|family] [on|off]
/unlink
```

Фото и документы без команды сохраняются в `data/telegram/{profileId}/`.

## Безопасность (pre-alpha)

- Токен бота только на сервере.
- Webhook secret рекомендуется в интернете.
- Inbox API без авторизации — только для локального/семейного инстанса.
