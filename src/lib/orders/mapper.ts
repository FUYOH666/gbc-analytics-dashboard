import type { Json } from "@/lib/database";
import type { NormalizedOrderRecord, RetailCrmOrder } from "@/lib/orders/types";

function toIsoDateTime(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;

  return new Date(normalized).toISOString();
}

function getCustomerName(order: RetailCrmOrder) {
  return [order.firstName, order.lastName].filter(Boolean).join(" ").trim();
}

function getItemsSummary(order: RetailCrmOrder) {
  return (order.items ?? [])
    .map((item) => item.productName?.trim())
    .filter((value): value is string => Boolean(value));
}

function getItemCount(order: RetailCrmOrder) {
  return (order.items ?? []).reduce(
    (total, item) => total + (item.quantity ?? 0),
    0,
  );
}

function getTotalAmount(order: RetailCrmOrder) {
  if (typeof order.totalSumm === "number") {
    return order.totalSumm;
  }

  return (order.items ?? []).reduce(
    (total, item) => total + (item.initialPrice ?? 0) * (item.quantity ?? 0),
    0,
  );
}

function getUtmSource(order: RetailCrmOrder) {
  if (
    order.customFields &&
    !Array.isArray(order.customFields) &&
    typeof order.customFields.utm_source === "string"
  ) {
    return order.customFields.utm_source;
  }

  return null;
}

export function mapRetailCrmOrderToRecord(
  order: RetailCrmOrder,
): NormalizedOrderRecord {
  const retailcrmOrderId =
    typeof order.id === "number" ? String(order.id) : order.externalId;

  if (!retailcrmOrderId) {
    throw new Error("RetailCRM order must have either id or externalId.");
  }

  return {
    retailcrm_order_id: retailcrmOrderId,
    customer_name: getCustomerName(order) || "Unknown customer",
    phone: order.phone ?? null,
    email: order.email ?? null,
    city: order.delivery?.address?.city ?? null,
    status: order.status ?? "unknown",
    order_method: order.orderMethod ?? null,
    utm_source: getUtmSource(order),
    total_amount: getTotalAmount(order),
    currency: order.currency ?? "KZT",
    item_count: getItemCount(order),
    items_summary: getItemsSummary(order),
    created_at: toIsoDateTime(order.createdAt),
    updated_at: toIsoDateTime(order.statusUpdatedAt ?? order.createdAt),
    imported_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    raw_payload: JSON.parse(JSON.stringify(order)) as Json,
  };
}
