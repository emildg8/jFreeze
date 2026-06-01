# Архитектура jFreeze

Стек и хостинг — только бесплатные варианты по умолчанию: [FREE_STACK.md](./FREE_STACK.md).

## Слои

1. **UI** — Next.js App Router, клиентские страницы + `AppShell` с нижней навигацией
2. **API** — Route Handlers (`/api/*`) — тонкий слой над сервисами
3. **Services** — бизнес-логика: orders, inventory, cart, stores, fridge
4. **Domain** — `CartEngine`, нормализация названий, `FridgeVisionProvider`
5. **Connectors** — адаптеры магазинов (`StoreConnector`)
6. **Data** — SQLite + Drizzle ORM

## Поток «умной корзины»

```
Заказы (история) ──┐
                   ├──> CartEngine.suggestCart() ──> cart_suggestions
Инвентарь (холод) ─┘
```

## Расширение

- Новый магазин: реализовать `StoreConnector` в `src/connectors/`
- Умный холодильник: заменить `HeuristicVisionProvider` на IoT-адаптер
- Mobile: Capacitor поверх `apps/web`
