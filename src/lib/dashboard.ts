import type { Database } from "@/lib/database";
import { hasConfiguredValue, readEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type SyncRunRow = Database["public"]["Tables"]["sync_runs"]["Row"];

export type DashboardData =
  | {
      state: "needs_setup";
      reason: string;
    }
  | {
      state: "error";
      message: string;
    }
  | {
      state: "ready";
      kpis: {
        revenue: number;
        ordersCount: number;
        averageCheck: number;
        topSource: string;
      };
      chartData: Array<{
        date: string;
        orders: number;
        revenue: number;
      }>;
      latestSync: SyncRunRow | null;
      recentOrders: Array<{
        retailcrmOrderId: string;
        customerName: string;
        city: string | null;
        status: string;
        totalAmount: number;
        createdAt: string;
      }>;
    };

function hasSupabaseEnv() {
  const env = readEnv();

  return Boolean(
    hasConfiguredValue(env.NEXT_PUBLIC_SUPABASE_URL) &&
      hasConfiguredValue(env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function formatChartDate(isoDate: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(isoDate));
}

function computeDashboardKpis(orders: OrderRow[]) {
  const revenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const ordersCount = orders.length;
  const averageCheck = ordersCount === 0 ? 0 : revenue / ordersCount;
  const sourceCounts = new Map<string, number>();

  for (const order of orders) {
    const source = order.utm_source ?? "unknown";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }

  const topSource =
    [...sourceCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "n/a";

  return {
    revenue,
    ordersCount,
    averageCheck,
    topSource,
  };
}

function buildChartData(orders: OrderRow[]) {
  const grouped = new Map<string, { date: string; orders: number; revenue: number }>();

  for (const order of orders) {
    const key = order.created_at.slice(0, 10);

    if (!grouped.has(key)) {
      grouped.set(key, {
        date: formatChartDate(order.created_at),
        orders: 0,
        revenue: 0,
      });
    }

    const bucket = grouped.get(key)!;
    bucket.orders += 1;
    bucket.revenue += order.total_amount;
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabaseEnv()) {
    return {
      state: "needs_setup",
      reason:
        "Добавьте Supabase URL и service role key в env, затем запустите import и sync.",
    };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [ordersResponse, syncRunsResponse] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1),
    ]);

    if (ordersResponse.error) {
      throw new Error(ordersResponse.error.message);
    }

    if (syncRunsResponse.error) {
      throw new Error(syncRunsResponse.error.message);
    }

    const orders = (ordersResponse.data ?? []) as OrderRow[];
    const latestSync = (syncRunsResponse.data?.[0] ?? null) as SyncRunRow | null;

    return {
      state: "ready",
      kpis: computeDashboardKpis(orders),
      chartData: buildChartData(orders),
      latestSync,
      recentOrders: orders.slice(0, 6).map((order) => ({
        retailcrmOrderId: order.retailcrm_order_id,
        customerName: order.customer_name,
        city: order.city,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
      })),
    };
  } catch (error) {
    return {
      state: "error",
      message:
        error instanceof Error ? error.message : "Unknown dashboard loading error",
    };
  }
}
