import { describe, expect, it } from "vitest";

import {
  buildRetailCrmExternalId,
  buildRetailCrmUploadOrdersPayload,
  chunkOrders,
  filterOrdersForImport,
  type MockOrder,
} from "@/lib/orders/import-payload";

const sampleOrder: MockOrder = {
  firstName: "Айгуль",
  lastName: "Касымова",
  phone: "+77001234501",
  email: "aigul.kasymova@example.com",
  orderType: "eshop-individual",
  orderMethod: "shopping-cart",
  status: "new",
  items: [{ productName: "Nova Classic", quantity: 2, initialPrice: 15000 }],
  delivery: {
    address: {
      city: "Алматы",
      text: "ул. Абая 150, кв 12",
    },
  },
  customFields: {
    utm_source: "instagram",
  },
};

describe("buildRetailCrmExternalId", () => {
  it("creates deterministic ids for re-runs", () => {
    expect(buildRetailCrmExternalId(sampleOrder, 0)).toBe(
      "mock-order-001-aigul-kasymova-01",
    );
    expect(buildRetailCrmExternalId(sampleOrder, 11)).toBe(
      "mock-order-012-aigul-kasymova-01",
    );
  });
});

describe("buildRetailCrmUploadOrdersPayload", () => {
  it("builds upload payload with site and derived timestamps", () => {
    const payload = buildRetailCrmUploadOrdersPayload(
      [sampleOrder],
      "nova-shop",
      new Date("2026-04-14T12:00:00.000Z"),
    );

    expect(payload.site).toBe("nova-shop");
    expect(payload.orders).toHaveLength(1);
    expect(payload.orders[0]).toMatchObject({
      externalId: "mock-order-001-aigul-kasymova-01",
      firstName: "Айгуль",
      lastName: "Касымова",
      phone: "+77001234501",
      email: "aigul.kasymova@example.com",
      orderMethod: "shopping-cart",
      status: "new",
      countryIso: "KZ",
      customFields: {
        utm_source: "instagram",
      },
    });

    expect(payload.orders[0].delivery.address).toEqual({
      city: "Алматы",
      text: "ул. Абая 150, кв 12",
    });
    expect(payload.orders[0].items).toEqual([
      {
        productName: "Nova Classic",
        quantity: 2,
        initialPrice: 15000,
      },
    ]);
    expect(payload.orders[0].createdAt).toBe("2026-04-14 12:00:00");
  });
});

describe("chunkOrders", () => {
  it("splits payloads by upload limit", () => {
    const orders = Array.from({ length: 51 }, (_, index) => ({
      ...sampleOrder,
      firstName: `Name-${index + 1}`,
    }));

    const chunks = chunkOrders(orders, 50);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(50);
    expect(chunks[1]).toHaveLength(1);
  });
});

describe("filterOrdersForImport", () => {
  it("skips orders that already exist in RetailCRM by externalId", () => {
    const orders = [
      sampleOrder,
      {
        ...sampleOrder,
        firstName: "Дина",
        lastName: "Жуматова",
        phone: "+77012345602",
      },
    ];

    const filtered = filterOrdersForImport(orders, new Set(["mock-order-001-aigul-kasymova-01"]));

    expect(filtered.alreadyExistingCount).toBe(1);
    expect(filtered.missing).toHaveLength(1);
    expect(buildRetailCrmExternalId(filtered.missing[0].order, filtered.missing[0].sourceIndex)).toBe(
      "mock-order-002-dina-zhumatova-01",
    );
  });

  it("preserves original source index for stable external ids after filtering", () => {
    const orders = [
      sampleOrder,
      {
        ...sampleOrder,
        firstName: "Дина",
        lastName: "Жуматова",
        phone: "+77012345602",
      },
      {
        ...sampleOrder,
        firstName: "Нургуль",
        lastName: "Ахметова",
        phone: "+77023456703",
      },
    ];

    const filtered = filterOrdersForImport(
      orders,
      new Set(["mock-order-001-aigul-kasymova-01", "mock-order-002-dina-zhumatova-01"]),
    );

    expect(filtered.missing).toHaveLength(1);
    expect(filtered.missing[0].sourceIndex).toBe(2);
    expect(
      buildRetailCrmExternalId(filtered.missing[0].order, filtered.missing[0].sourceIndex),
    ).toBe("mock-order-003-nurgul-ahmetova-01");
  });
});
