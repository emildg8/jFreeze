# jFreeze — мобильные приложения (Android и iOS)

Общая схема: [PLATFORMS.md](./PLATFORMS.md).

## Важно

Приложения Capacitor — это **клиент** к серверу jFreeze. Сервер должен быть доступен:

- **Разработка:** ПК с `npm run dev` в той же Wi‑Fi сети
- **Дом:** мини-ПК / VPS с jFreeze 24/7
- **Windows:** программа jFreeze на домашнем ПК + URL в настройках телефона

В приложении: **Настройки → Сервер jFreeze** → URL → Проверить → Сохранить.

## Android (телефон и планшет)

| Режим | Технология |
|-------|------------|
| UI | Capacitor WebView |
| Сканер камеры | Google ML Kit |
| Сканер в браузере | html5-qrcode (PWA) |

```powershell
cd apps/web
npm install
npm run dev

# Эмулятор Android Studio:
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"
# Реальное устройство (замените IP):
# $env:CAPACITOR_SERVER_URL="http://192.168.1.10:3000"

npx cap add android
npm run cap:sync
npm run cap:android
```

Разрешения: камера (сканер, фото чеков).

## iPhone и iPad

Требуется **macOS** и **Xcode**.

```bash
cd apps/web
npm install
npm run dev

export CAPACITOR_SERVER_URL=http://localhost:3000
npx cap add ios
npm run cap:sync
npm run cap:ios
```

На iPhone/iPad в Safari откройте тот же URL сервера в настройках приложения (IP ПК в Wi‑Fi).

Сканер: в нативной сборке — камера через web API / html5-qrcode; ML Kit только на Android.

## PWA без магазина

Chrome/Safari → сайт → «На экран Домой». Работает на iOS и Android без App Store.

## Сборка на продакшен URL

```bash
export CAPACITOR_PRODUCTION_URL=https://your-vps.example.com
npm run cap:sync
```

Затем сборка в Android Studio / Xcode.
