# Changelog

## [Unreleased]

## [0.2.0-pre-alpha] — 2026-06-01

Второй pre-alpha: источники заказов, IMAP, ОФД QR, Telegram, пять платформ, стабилизация monorepo.

### Добавлено

- **Платформы:** Web/PWA, Windows (Electron), Android/iOS (Capacitor), Telegram-бот — [docs/PLATFORMS.md](docs/PLATFORMS.md)
- **Источники заказов:** почта, SMS, автоопределение магазинов РФ — `/sources`
- **IMAP:** Gmail / Яндекс / Mail.ru (`imapflow`), пресеты, авто-синк 6/12/24 ч, `npm run imap:sync`
- **QR ОФД:** вкладка на «Заказы», API `/api/receipts/ofd`, QR с фото — [docs/OFD.md](docs/OFD.md)
- **Telegram:** уведомления, семейная лента, `/link` — [docs/TELEGRAM_BOT.md](docs/TELEGRAM_BOT.md)
- Авто-напоминания о сроке годности в Telegram (`POST /api/reminders/tick`, `npm run reminders:daily`)
- Экспорт заказов: Excel, CSV, JSON — `/export`
- Сканер штрихкодов (PWA + Capacitor), Open Food Facts
- Импорт чеков: фото, PDF, CSV, EML, текст из почты
- Заказы: поиск, фильтр по магазину, «Повторить последний заказ»
- Главная: расходы за 7 дней, быстрые ссылки
- Холодильник: быстрые сроки +3/+7/+14/+30 дн.
- `npm run verify` — lint, unit, build, e2e; CI GitHub Actions
- Настройки: сервер для мобильных клиентов, `GET /api/health`

### Исправлено

- Monorepo: один `package-lock.json`, `turbopack.root` + `outputFileTracingRoot`
- Dev по умолчанию Webpack (`npm run dev`), Turbopack — `npm run dev:turbo`
- SQLite: путь `data/jfreeze.db` при запуске из корня monorepo
- E2E стабильны (`CI=1`, `next start` на порту 3099)
- Границы ошибок: `error.tsx`, `global-error.tsx`, `loading.tsx`
- IMAP: одно Telegram-уведомление за синхронизацию; поиск по доменам включённых магазинов

### Ограничения

- Нет официальных API Озон / Самокат и др. — импорт из почты, SMS, CSV, чеков
- IMAP/OFD HTML-парсинг зависит от оператора; детальный ОФД — опционально `PROVERKA_CHEKA_TOKEN`
- Локальная SQLite, без облачной синхронизации между устройствами

### Установка

```bash
git clone -b release/pre-alpha-0.2 https://github.com/emildg8/jFreeze.git
cd jFreeze
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

## [0.1.0-pre-alpha] — 2026-06-01

Первая публичная pre-alpha для тестирования и самостоятельного развёртывания.

### Включено

- PWA: главная, заказы, холодильник, умная корзина, «Ещё»
- Импорт заказов: демо, CSV, ручной ввод, чеки
- Умная корзина: приоритет цена/качество/состав, бюджет, фильтры, AI-совет
- Холодильник: фото (эвристика + OpenAI), инвентарь, план расстановки
- Срок годности и напоминания
- Единый UI (Screen / Section / Panel, нижняя навигация)
- Семья, Pro (демо), smart-fridge stub, Capacitor-ready

### Политика «только бесплатные инструменты»

- Документ: [docs/FREE_STACK.md](docs/FREE_STACK.md)
- Разработка и запуск: Node, Next.js, SQLite, GitHub — $0
- Pro в приложении — демо-переключатель, **без оплаты**
- OpenAI — опционально (BYOK), без ключа работает эвристика и rule-based корзина

### Установка (0.1)

```bash
git clone -b release/pre-alpha-0.1 https://github.com/emildg8/jFreeze.git
cd jFreeze
npm install
cd apps/web && cp .env.example .env.local && npm run dev
```
