# Roadmap

**Стек:** только бесплатные инструменты по умолчанию — [FREE_STACK.md](./FREE_STACK.md).

## v0.1 — день 1 ✅

- [x] PWA веб-приложение
- [x] Демо/CSV/ручной импорт заказов
- [x] Инвентарь холодильника + фото
- [x] Rule-based корзина
- [x] Гайд по хранению

## v0.2 — pre-alpha ✅

- [x] CSV-шаблоны под чеки (универсальный, чек, Озон, Пятёрочка)
- [x] Улучшенная нормализация названий (синонимы)
- [x] Напоминания о сроке годности
- [x] IMAP, QR ОФД, Telegram-бот, 5+ платформ (Web, Desktop, mobile, TG)
- [x] Расходы за 7 дней и **дашборд по категориям** (главная)
- [x] **Камера QR ОФД** на странице заказов
- [x] **Расширение Chrome** (`extensions/browser/`, [BROWSER_EXTENSION.md](./BROWSER_EXTENSION.md))
- [x] CI на `main`, релиз `v0.2.0-pre-alpha`

## v0.3 — неделя 2 ✅

- [x] Опциональный Vision API (ключ пользователя / Pro)
- [x] Экспорт корзины (Share, Telegram, WhatsApp)

## v0.4 — неделя 3 ✅

- [x] Capacitor конфиг для Android APK
- [x] Push-уведомления (Service Worker + локальные напоминания)

## v1.0 ✅

- [x] Магазины beta (Озон/Самокат/Пятёрочка/Перекрёсток CSV)
- [x] Smart fridge adapter (Home Assistant HTTP)
- [x] Семейные профили
- [x] Pro-флаг (демо, без оплаты)
- [x] Политика FREE_STACK (документация)

## Сборка Android

```bash
cd apps/web
npm run build
# для Capacitor static export настройте output: 'export' или используйте server URL
npx cap add android
npx cap sync android
npx cap open android
```
