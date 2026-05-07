import { describe, expect, it } from "vitest";

import { mapRetailCrmOrderToRecord } from "@/lib/orders/mapper";

const baseOrder = {
  id: 124,
  externalId: "mock-order-001-buyer-001-01",
  firstName: "Buyer",
  lastName: "001",
  phone: "+100000001",
  email: "buyer001@example.com",
  status: "new",
  orderMethod: "shopping-cart",
  totalSumm: 45000,
  createdAt: "2026-04-14 12:00:00",
  statusUpdatedAt: "2026-04-14 14:30:00",
  delivery: {
    address: {
      city: "Demo City A",
      text: "Demo Street 1, unit 1",
    },
  },
  customFields: {
    utm_source: "instagram",
  },
  items: [
    {
      productName: "Demo SKU-01",
      quantity: 1,
      initialPrice: 15000,
    },
    {
      productName: "Demo SKU-02",
      quantity: 2,
      initialPrice: 15000,
    },
  ],
};

describe("mapRetailCrmOrderToRecord", () => {
  it("maps a RetailCRM order into the analytics table shape", () => {
    const mapped = mapRetailCrmOrderToRecord(baseOrder);

    expect(mapped).toMatchObject({
      retailcrm_order_id: "124",
      customer_name: "Buyer 001",
      phone: "+100000001",
      email: "buyer001@example.com",
      city: "Demo City A",
      status: "new",
      order_method: "shopping-cart",
      utm_source: "instagram",
      total_amount: 45000,
      currency: "KZT",
      item_count: 3,
      items_summary: ["Demo SKU-01", "Demo SKU-02"],
      created_at: "2026-04-14T12:00:00.000Z",
      updated_at: "2026-04-14T14:30:00.000Z",
    });
    expect(mapped.raw_payload).toMatchObject({
      externalId: "mock-order-001-buyer-001-01",
    });
    expect(mapped.last_synced_at).toMatch(/T/);
  });

  it("falls back to item totals and externalId when numeric id is absent", () => {
    const mapped = mapRetailCrmOrderToRecord({
      ...baseOrder,
      id: undefined,
      totalSumm: undefined,
      statusUpdatedAt: undefined,
    });

    expect(mapped.retailcrm_order_id).toBe("mock-order-001-buyer-001-01");
    expect(mapped.total_amount).toBe(45000);
    expect(mapped.updated_at).toBe("2026-04-14T12:00:00.000Z");
  });

  it("supports array customFields payloads from live RetailCRM responses", () => {
    const mapped = mapRetailCrmOrderToRecord({
      ...baseOrder,
      customFields: [],
      currency: "RUB",
    });

    expect(mapped.utm_source).toBeNull();
    expect(mapped.currency).toBe("RUB");
  });
});
