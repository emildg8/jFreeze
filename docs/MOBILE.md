# jFreeze — мобильное приложение (Capacitor Android)

## Сканер штрихкодов

| Режим | Где | Технология |
|-------|-----|------------|
| Камера (APK) | Холодильник → «Сканировать камерой» | Google ML Kit (`@capacitor-mlkit/barcode-scanning`) |
| Камера (браузер/PWA) | То же | `html5-qrcode` + камера |
| Фото | «Штрихкод с фото» | ML Kit (APK) или html5-qrcode (web) |

Поддерживаются **EAN-13, EAN-8, UPC** и линейные коды (CODE-128). Название товара подставляется из [Open Food Facts](https://world.openfoodfacts.org/) (бесплатно).

## Сборка Android

```bash
cd apps/web
npm install
npm install -D @capacitor/cli @capacitor/android

# Dev: приложение грузит UI с локального сервера
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"   # эмулятор
# или http://192.168.x.x:3000 — IP вашего ПК в Wi‑Fi

npm run dev   # в отдельном терминале

npx cap add android    # один раз
npx cap sync
npx cap open android
```

В Android Studio: Run на устройстве. Разрешите **камеру** при первом сканировании.

## Разрешения (Android)

Плагин ML Kit добавляет в манифест при `cap sync`:

- `CAMERA` — сканер и фото чеков
- Google Play Services — модуль сканера (устанавливается при первом запуске)

## Без нативной сборки

PWA в Chrome на телефоне: вкладка **Холодильник** → сканер в браузере (нужен HTTPS или localhost).
