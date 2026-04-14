import { KpiCards } from "@/components/dashboard/kpi-cards";
import { OrdersChart } from "@/components/dashboard/orders-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { runManualImportAction, runManualSyncAction } from "@/app/manual-actions";
import { getDashboardData } from "@/lib/dashboard";

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value)} ₸`;
}

export default async function HomePage() {
  const dashboard = await getDashboardData();

  const kpiItems =
    dashboard.state === "ready"
      ? [
          {
            label: "Выручка",
            value: formatMoney(dashboard.kpis.revenue),
            hint: "Сумма total_amount по всем синхронизированным заказам",
          },
          {
            label: "Заказы",
            value: String(dashboard.kpis.ordersCount),
            hint: "Количество записей в аналитической таблице orders",
          },
          {
            label: "Средний чек",
            value: formatMoney(dashboard.kpis.averageCheck),
            hint: "Выручка / количество заказов",
          },
          {
            label: "Топ-канал",
            value: dashboard.kpis.topSource,
            hint: "Лидер по utm_source среди заказов",
          },
        ]
      : [
          {
            label: "Выручка",
            value: "0 ₸",
            hint: "Появится после первого sync",
          },
          {
            label: "Заказы",
            value: "0",
            hint: "Запустите import и sync",
          },
          {
            label: "Средний чек",
            value: "0 ₸",
            hint: "Посчитаем после загрузки данных",
          },
          {
            label: "Топ-канал",
            value: "n/a",
            hint: "Нужны custom fields из RetailCRM",
          },
        ];

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <div
            className={`tag ${dashboard.state === "ready" ? "success" : "warning"}`}
          >
            {dashboard.state === "ready"
              ? "Dashboard подключён к данным"
              : "Требуется настройка интеграции"}
          </div>
          <h1>GBC Analytics Dashboard</h1>
          <p>
            Мини-система аналитики и operational visibility для заказов из
            RetailCRM: импорт mock данных, sync в Supabase, KPI, график и
            foundation под Telegram alerts.
          </p>
        </div>
        <div className="actions">
          <form action={runManualImportAction}>
            <button className="button secondary" type="submit">
              Import mock orders
            </button>
          </form>
          <form action={runManualSyncAction}>
            <button className="button" type="submit">
              Run manual sync
            </button>
          </form>
        </div>
      </header>

      <KpiCards items={kpiItems} />

      <section className="grid main-grid" style={{ marginTop: 20 }}>
        <article className="panel">
          <h2>Динамика заказов и выручки</h2>
          {dashboard.state === "ready" ? (
            <OrdersChart data={dashboard.chartData} />
          ) : (
            <p className="muted">
              {dashboard.state === "needs_setup"
                ? dashboard.reason
                : dashboard.message}
            </p>
          )}
        </article>

        <aside className="panel stack">
          <div>
            <h2>Статус синхронизации</h2>
            <p className="muted">
              Последний прогон pipeline, показатели upsert и готовность данных
              для аналитики.
            </p>
          </div>
          <SyncStatus latestSync={dashboard.state === "ready" ? dashboard.latestSync : null} />
        </aside>
      </section>

      <section className="grid main-grid" style={{ marginTop: 20 }}>
        <article className="panel">
          <h2>Последние заказы</h2>
          <RecentOrders
            orders={dashboard.state === "ready" ? dashboard.recentOrders : []}
          />
        </article>

        <aside className="panel stack">
          <div>
            <h2>Runbook</h2>
            <p className="muted">
              Быстрый порядок действий для локальной проверки end-to-end flow.
            </p>
          </div>
          <div className="list">
            <div className="list-item">1. Заполнить `.env.local` на основе `.env.example`.</div>
            <div className="list-item">2. Выполнить import mock заказов в RetailCRM.</div>
            <div className="list-item">3. Запустить manual sync и обновить страницу.</div>
            <div className="list-item">4. Проверить `/api/healthz` и статус последнего sync.</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
