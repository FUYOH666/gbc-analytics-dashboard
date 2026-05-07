import { describe, expect, it } from "vitest";

import {
  buildRetailCrmFormBody,
  shouldRetryRetailCrmWithoutVersion,
} from "@/lib/retailcrm";

describe("buildRetailCrmFormBody", () => {
  it("serializes nested payload fields as JSON strings", () => {
    const body = buildRetailCrmFormBody({
      site: "demo-site",
      orders: [
        {
          externalId: "mock-order-001",
          firstName: "Buyer",
        },
      ],
    });

    expect(body.get("site")).toBe("demo-site");
    expect(body.get("orders")).toBe(
      JSON.stringify([
        {
          externalId: "mock-order-001",
          firstName: "Buyer",
        },
      ]),
    );
  });
});

describe("shouldRetryRetailCrmWithoutVersion", () => {
  it("retries on API method not found 404 responses", () => {
    expect(
      shouldRetryRetailCrmWithoutVersion(404, {
        errorMsg: "API method not found",
      }),
    ).toBe(true);
  });

  it("does not retry unrelated errors", () => {
    expect(
      shouldRetryRetailCrmWithoutVersion(400, {
        errorMsg: 'Input value "orders" contains a non-scalar value.',
      }),
    ).toBe(false);
  });
});
