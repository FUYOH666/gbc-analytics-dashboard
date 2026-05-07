# Changelog

## 2026-05-07

- README и CONTRIBUTING приведены к текущему состоянию репозитория (`retail-crm-analytics-demo`), убраны устаревшие инструкции по переименованию
- `OrdersChart`: фиксированная высота `ResponsiveContainer` / `min-width` у контейнера — без предупреждений Recharts при `next build`
- CI: `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` для совместимости с актуальными GitHub Actions

## 2026-05-06

- анонимизация демо: `mock_orders.json` с нейтральными SKU и «Buyer NNN»; переименование проекта в **Retail CRM Analytics Demo**, пакет `retail-crm-analytics-demo` (v0.3.0); обновлены тесты, README, ссылки под целевой GitHub slug `retail-crm-analytics-demo`
- добавлены `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, `docs/ARCHITECTURE.md`
- добавлены GitHub Actions CI (lint, typecheck, test, build), шаблоны Issues/PR
- обновлён README: бейджи, блок для рекрутеров/коллабораций, превью в `docs/images/`

## 2026-04-14

- собран `Next.js` fullstack demo для `RetailCRM -> Supabase -> Dashboard -> Telegram`
- добавлены import route, sync pipeline, `healthz`, `sync_runs` и high-value alerts
- добавлены SQL schema, cron config, unit tests и краткая русская документация
