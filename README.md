# jFreeze — pre-alpha 0.1

> **Статус:** pre-alpha · ветка `release/pre-alpha-0.1` · не для продакшена без бэкапов данных.

> **Инструменты:** только бесплатные для разработки и запуска — см. [docs/FREE_STACK.md](docs/FREE_STACK.md). Платные API (OpenAI и т.д.) — **опционально**, по вашему ключу.

Умный помощник для покупок: история заказов, холодильник, **умная корзина** (цена / качество / состав, бюджет, без бакалеи), AI-совет по корзине, план расстановки в холодильнике, срок годности, семейные профили.

### Сценарий «умная корзина»

1. Загрузите заказы (демо, CSV, вручную) и заполните **Холодильник**.
2. На **Корзина** задайте приоритет, бюджет, фильтры → **Собрать умную корзину**.
3. AI-совет — только если включили и указали свой ключ OpenAI (опционально, платный у провайдера).
4. На **Холодильник** — блок **Расстановка** (полки, температура, сроки).

## Быстрый старт

```bash
git clone -b release/pre-alpha-0.1 https://github.com/emildg8/jFreeze.git
cd jFreeze
npm install
cd apps/web
cp .env.example .env.local   # можно оставить пустым — полностью бесплатный режим
npm run dev
```

Из корня монорепо: `npm run dev` (тот же dev-сервер).

Откройте http://localhost:3000

## Качество

```bash
npm test          # unit (14 тестов)
npm run test:e2e  # e2e smoke
npm run lint
npm run build
```

## Архитектура (кратко)

| Слой | Путь |
|------|------|
| UI | `src/app/*`, `src/components/*` |
| API | `src/app/api/*` |
| Бизнес-логика | `src/lib/services/*`, `src/lib/cart/*` |
| Магазины | `src/connectors/*` |
| Данные | SQLite + Drizzle (`data/jfreeze.db`) |

Общий клиент запросов: `src/lib/api/client.ts` (`apiFetch`, `importOrders`, `refreshCart`).

Единый UI: `docs/UI.md`, компоненты `Screen` / `Section` / `Panel`, верхняя панель и нижняя навигация.

## Переменные окружения

Все опциональны. Подробно: [docs/FREE_STACK.md](docs/FREE_STACK.md).

| Переменная | Назначение | Стоимость |
|------------|------------|-----------|
| `DATABASE_URL` | Путь к SQLite (локально) | $0 |
| `OPENAI_API_KEY` | AI-фото / совет корзины | Pay-as-you-go у OpenAI, **не обязателен** |
| `CAPACITOR_SERVER_URL` | URL для Android (Capacitor) | $0 |

## Android

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run dev
# в другом терминале, эмулятор:
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"
npx cap add android
npm run cap:sync
npm run cap:android
```

## Лицензия

MIT
