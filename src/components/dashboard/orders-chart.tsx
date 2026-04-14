"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OrdersChartProps = {
  data: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTooltipValue(value: number | string | undefined, name: string) {
  if (name === "revenue" && typeof value === "number") {
    return [`${formatCurrency(value)} ₸`, "Выручка"] as const;
  }

  return [value ?? "", name === "revenue" ? "Выручка" : "Заказы"] as const;
}

export function OrdersChart({ data }: OrdersChartProps) {
  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.14)" />
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            formatter={(value, name) => formatTooltipValue(value as number | string | undefined, String(name))}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#38bdf8"
            strokeWidth={3}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
