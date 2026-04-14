type RecentOrdersProps = {
  orders: Array<{
    retailcrmOrderId: string;
    customerName: string;
    city: string | null;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value)} ₸`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return <p className="muted">После первого sync здесь появятся последние заказы.</p>;
  }

  return (
    <div className="list">
      {orders.map((order) => (
        <div className="list-item" key={order.retailcrmOrderId}>
          <div className="row">
            <strong>{order.customerName}</strong>
            <span className="muted">{formatMoney(order.totalAmount)}</span>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="muted">
              {order.city ?? "Город не указан"} · {order.status}
            </span>
            <span className="muted">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
