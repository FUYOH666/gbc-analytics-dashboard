# GBC Analytics Dashboard

Краткий demo-проект для тестового задания: импорт заказов в `RetailCRM`, синхронизация в `Supabase`, web-dashboard на `Next.js` и Telegram-алерты для high-value заказов.

Проект оформлен как публичный demo-case с упором на repeatable integrations, operational visibility и понятную бизнес-ценность.

## Live demo

- Production: [gbc-analytics-dashboard-teal.vercel.app](https://gbc-analytics-dashboard-teal.vercel.app/)
- GitHub: [FUYOH666/gbc-analytics-dashboard](https://github.com/FUYOH666/gbc-analytics-dashboard)

## Что реализовано

- repeatable import `mock_orders.json` в `RetailCRM`
- ручной и cron-driven sync `RetailCRM -> Supabase`
- идемпотентный `upsert` по `retailcrm_order_id`
- dashboard с KPI, графиком и блоком последней синхронизации
- дедупликация Telegram-уведомлений по `(order_id, threshold)`
- `healthz` endpoint и `sync_runs` для operational visibility

## Архитектура

```text
mock_orders.json
  -> /api/import-retailcrm
  -> RetailCRM
  -> /api/sync
  -> Supabase (orders, sync_runs, order_alerts)
  -> Dashboard /
  -> Telegram Bot API
```

## Стек

- `Next.js` App Router
- `Supabase` Postgres
- `Recharts`
- `Vercel Cron`
- `Telegram Bot API`

## Переменные окружения

Смотрите `.env.example`.

Обязательные для dashboard и sync:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RETAILCRM_BASE_URL`
- `RETAILCRM_API_KEY`
- `RETAILCRM_SITE_CODE`

Обязательные для Telegram alerts:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Обязательные для Vercel Cron:

- `CRON_SECRET`

## Локальный запуск

```bash
pnpm install
pnpm dev
```

По умолчанию локальный запуск идёт на `http://localhost:3001`.

Проверка:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Как пользоваться

Базовый сценарий проверки:

1. Заполнить `.env.local`.
2. Запустить `pnpm dev`.
3. Открыть `http://localhost:3001`.
4. Нажать `Import mock orders`, чтобы загрузить тестовые заказы в `RetailCRM`.
5. Нажать `Run manual sync`, чтобы синхронизировать данные в `Supabase`.
6. Обновить dashboard и проверить KPI, график и статус последней синхронизации.

## Telegram alerts

В этом проекте Telegram используется не как conversational bot, а как канал уведомлений.

- Перед первым использованием достаточно один раз открыть бота и отправить `/start`, чтобы чат стал доступен для уведомлений.
- После этого проект сам отправляет сообщения, если в `RetailCRM` появляются или синхронизируются заказы выше порога `HIGH_VALUE_THRESHOLD_KZT`.
- Дополнительно описывать сложный Telegram UX не нужно, потому что в текущем проекте это не продуктовый интерфейс, а operational alert channel.

## Public demo behavior

- Production deployment intentionally works as a read-only showcase from the UI.
- Manual `import` and `sync` controls are available in local development, but hidden in production.
- This keeps the public demo cleaner and prevents anonymous visitors from triggering write operations.

## Основные маршруты

- `GET /api/healthz` — базовый health check
- `POST /api/import-retailcrm` — импорт mock заказов в `RetailCRM`, защищён через `Authorization: Bearer <CRON_SECRET>`
- `POST /api/sync` — ручная синхронизация в `Supabase`, защищена через `Authorization: Bearer <CRON_SECRET>`
- `GET /api/sync` — cron-triggered sync, защищён через `Authorization: Bearer <CRON_SECRET>`

Кнопки на главной странице запускают ручной import/sync через server actions, чтобы не держать публичные незащищённые POST entrypoints.

## Деплой

1. Создать проект в `Supabase` и применить SQL из `supabase/migrations/`.
2. Создать demo-аккаунт в `RetailCRM`.
3. Настроить bot/token/chat в `Telegram`.
4. Задеплоить проект на `Vercel`.
5. Перенести env из `.env.example`.
6. Убедиться, что cron ходит в `/api/sync` с `CRON_SECRET`.

Для `Vercel Hobby` в проекте используется daily cron. Более частый hourly cron потребует `Pro` план.

## Public repo hygiene

- `.env.local` и любые локальные секреты не коммитятся.
- В репозитории оставлены только placeholder-значения в `.env.example`.
- В публичный README не выносятся реальные API keys, service-role secrets или приватные internal URLs.
- `package.json` остаётся с `"private": true`, чтобы исключить случайную публикацию в npm.

## AI workflow

Что просили в README по процессу работы с AI:

- основной фокус был не на «сделать страницу», а на repeatable integration flow
- сначала был выбран формат `Strong demo`, а не голый MVP
- для `Next.js`, `Supabase`, `Vercel Cron`, `Recharts` и `Telegram Bot API` использовалась актуальная документация

Примеры рабочих промптов:

- `Разбери тестовое как продуктовый кейс и предложи профессиональную архитектуру без оверинжиниринга`
- `Собери Strong demo: RetailCRM -> Supabase -> Dashboard -> Telegram`
- `Сделай идемпотентный sync и не допускай дублей при повторном запуске`
- `Добавь observability: sync_runs, status block, health endpoint`

Где был затык:

- `create-next-app` не создал проект в корневой папке из-за uppercase имени директории
- `eslint@latest` оказался несовместим с текущим `eslint-config-next`
- при построении import-flow выяснилось, что после фильтрации заказов может “съехать” стабильный `externalId`

Как было решено:

- каркас `Next.js` был собран вручную
- `eslint` был зафиксирован на совместимой мажорной версии
- import-логика была переведена на stable `sourceIndex`, чтобы rerun не ломал repeatability

## Ограничения

- live-проверка against real `RetailCRM`, `Supabase` и `Telegram` требует реальных credentials
- текущий sync в `v1` синхронизирует полный список заказов; более умный incremental/history flow вынесен в roadmap
- screenshot Telegram-уведомления и production URLs появляются после реального прогона с настроенными интеграциями

## Roadmap

- `v1.1` — incremental sync через `orders/history` или webhook trigger
- `v1.2` — фильтры по статусам, городам и `utm_source`
- `v1.3` — daily digest в Telegram
- `v1.4` — страница `sync history`
- `v1.5` — anomaly alerts по среднему чеку и выручке

## Author

Проект собран и оформлен Александром Мордвиновым как applied AI / product engineering demo-case.

## Contact

- Website: [scanovich.ai](https://scanovich.ai/)
- Telegram: [@ScanovichAI](https://t.me/ScanovichAI)
- GitHub: [FUYOH666](https://github.com/FUYOH666)
