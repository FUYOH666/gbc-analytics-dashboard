import { describe, expect, it } from "vitest";

import { isAuthorizedByBearerSecret } from "@/lib/request-auth";

describe("isAuthorizedByBearerSecret", () => {
  it("returns true for the matching bearer token", () => {
    expect(isAuthorizedByBearerSecret("Bearer demo-secret", "demo-secret")).toBe(
      true,
    );
  });

  it("returns false for missing or invalid auth header", () => {
    expect(isAuthorizedByBearerSecret(null, "demo-secret")).toBe(false);
    expect(isAuthorizedByBearerSecret("Bearer wrong", "demo-secret")).toBe(false);
  });

  it("throws if the server secret is not configured", () => {
    expect(() => isAuthorizedByBearerSecret("Bearer demo-secret", undefined)).toThrow(
      "Server secret is required for protected routes.",
    );
  });
});
