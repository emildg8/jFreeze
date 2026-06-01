# jFreeze — все платформы

Один продукт, пять каналов доставки.

| Платформа | Статус | Технология |
|-----------|--------|------------|
| **Веб (ПК, планшет)** | ✅ | Next.js PWA |
| **Windows** | ✅ | Electron + встроенный сервер |
| **Android** (телефон, планшет) | ✅ | Capacitor 6 + ML Kit |
| **iPhone / iPad** | ✅ | Capacitor 6 |
| **Telegram** | ✅ | Bot API |

## Архитектура

```text
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ Web / PWA   │  │ Win Desktop  │  │ TG Bot      │
└──────┬──────┘  └──────┬───────┘  └──────┬──────┘
       │                │                  │
       └────────────────┼──────────────────┘
                        ▼
              Next.js API + SQLite
              (локально или LAN/VPS)
```

Мобильные приложения — **WebView** к вашему серверу jFreeze.  
Windows — **сервер внутри установщика** (офлайн на ПК).

## 1. Веб (полная версия)

```bash
npm install
npm run dev
```

http://localhost:3000 — установка как PWA: «Установить приложение» в Chrome/Edge.

Планшеты: адаптивная вёрстка до `max-w-3xl`, `orientation: any` в manifest.

## 2. Windows

```bash
npm install
npm run build:desktop
cd apps/desktop && npm install
npm run dist
```

Установщик: `apps/desktop/dist/jFreeze-Setup-*.exe`

Разработка окна без сборки сервера:

```bash
npm run dev
npm run desktop:dev
```

Данные: `%APPDATA%/jfreeze-desktop/jfreeze.db`

## 3. Android

Требуется: [Android Studio](https://developer.android.com/studio), JDK 17.

```powershell
cd apps/web
npm install
npm run dev
# другой терминал:
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"   # эмулятор
# Wi‑Fi телефон: http://IP_ВАШЕГО_ПК:3000

npx cap add android    # один раз
npm run cap:sync
npm run cap:android
```

В приложении: **Настройки → Сервер jFreeze** — сохраните URL ПК.

Сборка release APK: Android Studio → Build → APK.

## 4. iPhone / iPad

Требуется: macOS, Xcode, Apple Developer (для устройства).

```bash
cd apps/web
npm install
export CAPACITOR_SERVER_URL=http://localhost:3000
npx cap add ios          # один раз
npm run cap:sync
npm run cap:ios
```

На устройстве в той же Wi‑Fi сети укажите `http://IP:3000` в настройках сервера.

## 5. Telegram

[TELEGRAM_BOT.md](./TELEGRAM_BOT.md)

```bash
npm run dev
npm run bot:telegram
```

## Проверка перед релизом

```bash
npm run verify
```

Lint + unit + build + e2e smoke.

## Переменные

| Переменная | Платформа |
|------------|-----------|
| `DATABASE_URL` | Все (путь SQLite) |
| `CAPACITOR_SERVER_URL` | Android/iOS dev |
| `CAPACITOR_PRODUCTION_URL` | Сборка APK/IPA на ваш VPS |
| `TELEGRAM_BOT_TOKEN` | Бот |
| `PUBLIC_APP_URL` | Ссылки в боте |
