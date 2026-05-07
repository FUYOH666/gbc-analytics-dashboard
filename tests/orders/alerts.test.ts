import { describe, expect, it } from "vitest";

import {
  buildOrderAlertKey,
  selectOrdersForAlert,
} from "@/lib/orders/alerts";

const orders = [
  {
    retailcrm_order_id: "101",
    customer_name: "Buyer 001",
    total_amount: 45000,
    status: "new",
    city: "Demo City A",
  },
  {
    retailcrm_order_id: "102",
    customer_name: "Buyer 002",
    total_amount: 62000,
    status: "new",
    city: "Demo City B",
  },
  {
    retailcrm_order_id: "103",
    customer_name: "Buyer 003",
    total_amount: 89000,
    status: "new",
    city: "Demo City C",
  },
];

describe("buildOrderAlertKey", () => {
  it("creates a unique dedupe key from order id and threshold", () => {
    expect(buildOrderAlertKey("102", "high-value-50000")).toBe(
      "102::high-value-50000",
    );
  });
});

describe("selectOrdersForAlert", () => {
  it("returns only orders above threshold without existing alert entries", () => {
    const selected = selectOrdersForAlert(
      orders,
      50000,
      "high-value-50000",
      new Set(["102::high-value-50000"]),
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].retailcrm_order_id).toBe("103");
  });
});
