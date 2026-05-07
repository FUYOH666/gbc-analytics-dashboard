import { describe, expect, it } from "vitest";

import { hasConfiguredValue } from "@/lib/env";

describe("hasConfiguredValue", () => {
  it("returns false for placeholders and empty values", () => {
    expect(hasConfiguredValue(undefined)).toBe(false);
    expect(hasConfiguredValue("")).toBe(false);
    expect(hasConfiguredValue("your-project.supabase.co")).toBe(false);
    expect(hasConfiguredValue("your-supabase-service-role-key")).toBe(false);
    expect(hasConfiguredValue("https://your-account.retailcrm.ru")).toBe(false);
  });

  it("returns true for real-looking values", () => {
    expect(hasConfiguredValue("https://abcdefghijklmnop.supabase.co")).toBe(
      true,
    );
    expect(hasConfiguredValue("sb_publishable_example")).toBe(true);
    expect(hasConfiguredValue("923DHi--9UoHXZ5_0FkZPNSj8ufBpxOJF46UfGy3u0c")).toBe(
      true,
    );
  });
});
