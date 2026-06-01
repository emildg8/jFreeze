# jFreeze — только бесплатные инструменты

**Политика проекта (pre-alpha и далее):** разработка, хостинг и ежедневное использование — на **$0** для инфраструктуры и лицензий. Платные SaaS не являются обязательными.

## Принцип

| Уровень | Правило |
|---------|---------|
| Обязательно | Open-source / free tier / self-host / локально |
| Опционально | Сервисы с личным ключом и **pay-as-you-go** (см. ниже) — пользователь сам решает |
| Не планируем | Обязательная подписка jFreeze, платные API магазинов без экспорта, vendor lock-in |

## Разработка (бесплатно)

| Инструмент | Назначение | Лицензия / цена |
|------------|------------|-----------------|
| [Node.js](https://nodejs.org/) | Runtime | Open source |
| [npm](https://www.npmjs.com/) | Пакеты | Бесплатно |
| [Next.js](https://nextjs.org/) | Web + API | MIT |
| [React](https://react.dev/) | UI | MIT |
| [Tailwind CSS](https://tailwindcss.com/) | Стили | MIT |
| [SQLite](https://www.sqlite.org/) | БД на диске | Public domain |
| [Drizzle ORM](https://orm.drizzle.team/) | Схема / запросы | Apache-2.0 |
| [Vitest](https://vitest.dev/) | Unit-тесты | MIT |
| [Playwright](https://playwright.dev/) | E2E | Apache-2.0 |
| [ESLint](https://eslint.org/) | Линт | MIT |
| [Git](https://git-scm.com/) + [GitHub](https://github.com/) | Версии, Issues, Releases | Бесплатно для public repo |
| [Docker](https://www.docker.com/) (опционально) | `docker-compose.yml` | CE бесплатно |
| [Capacitor](https://capacitorjs.com/) | Android-оболочка | MIT |
| [Android Studio](https://developer.android.com/studio) | Сборка APK | Бесплатно |

IDE: VS Code, Cursor, Neovim — на выбор, без требований к платным планам.

## Запуск у себя (бесплатно)

```bash
git clone -b release/pre-alpha-0.1 https://github.com/emildg8/jFreeze.git
cd jFreeze && npm install
cd apps/web && cp .env.example .env.local && npm run dev
```

Данные: файл `data/jfreeze.db` — без облачной БД.

## Хостинг (бесплатные варианты)

| Платформа | Что подходит | Ограничения free tier |
|-----------|--------------|------------------------|
| **Локально / домашний ПК** | Полный функционал, SQLite | Нужен доступ в сеть для PWA с телефона |
| **[Vercel](https://vercel.com/) Hobby** | Next.js deploy | Лимиты CPU/трафика; SQLite на serverless — только ephemeral* |
| **[Cloudflare Pages](https://pages.cloudflare.com/)** | Статика + Workers (адаптация) | Нужна доработка под персистентную БД |
| **VPS / Oracle Cloud Free Tier** | Docker + постоянный SQLite | Настройка вручную |
| **GitHub Actions** | CI (шаблон `docs/ci-workflow.example.yml`) | 2000 мин/мес для private; public — щедрее |

\* Для облака без своего VPS рекомендуем **self-host** или бесплатный VPS, чтобы SQLite жила на диске.

**Рекомендация pre-alpha:** `npm run dev` или Docker на своей машине / бесплатном VPS.

## Функции без платных API

| Функция | Бесплатный режим |
|---------|------------------|
| Заказы | Демо, CSV, ручной ввод, чеки |
| Умная корзина | Правила + подсказки из `product-hints.ru.json` |
| Фото холодильника | `HeuristicVisionProvider` (без сети) |
| Расстановка | `storage-guide.ru.json` |
| Срок годности | Локальные напоминания в UI |
| Семья (1 профиль) | `default` без Pro |
| Push (PWA) | Web Push API, без платного FCM** |
| Умный холодильник | [Home Assistant](https://www.home-assistant.io/) (self-host, бесплатно) |

\*\* Для простого PWA достаточно браузерных уведомлений; Firebase — не обязателен.

## Опционально (не бесплатно у провайдера)

Эти части **выключены по умолчанию**. Без ключей приложение работает.

| Сервис | Зачем | Альтернатива $0 |
|--------|-------|-----------------|
| [OpenAI API](https://openai.com/api/) | AI-фото, AI-совет корзины | Эвристика фото; корзина без `useAiAdvisor` |
| Платные API ритейлеров | Автосинк заказов | CSV / демо / ручной ввод |

Ключ OpenAI — **bring your own key** в настройках; мы не продаём токены.

## jFreeze Pro в pre-alpha

- **Нет оплаты**, нет App Store / Google Play биллинга.
- «Pro» — **локальный переключатель** в SQLite (`plan = pro`) для теста: несколько профилей, флаг возможностей.
- Цена «199 ₽» на экране Pro — **заглушка будущей модели**, не активная подписка.

## Что не используем как обязательное

- Платные БД (PlanetScale, Supabase paid, MongoDB Atlas paid)
- Платный auth (Auth0 paid, Clerk paid)
- Платная аналитика (Amplitude, Mixpanel paid)
- Платный хостинг как единственный способ запуска
- Обязательный OpenAI / обязательный облачный аккаунт jFreeze

## CI/CD

Шаблон: `docs/ci-workflow.example.yml` → GitHub Actions на бесплатных минутах.

```bash
gh auth refresh -h github.com -s workflow
cp docs/ci-workflow.example.yml .github/workflows/ci.yml
```

## Проверка «всё ещё бесплатно»

Перед релизом:

1. `npm install` / `npm run build` / `npm test` — без платных CLI.
2. Запуск без `.env` — работают демо, корзина, эвристика фото.
3. Новая интеграция — сначала CSV/локально; платный API только opt-in.

## Ссылки

- [ARCHITECTURE.md](./ARCHITECTURE.md) — слои приложения
- [INTEGRATIONS.md](./INTEGRATIONS.md) — магазины без consumer API
- [UI.md](./UI.md) — интерфейс
