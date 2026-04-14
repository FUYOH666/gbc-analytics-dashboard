import { describe, expect, it } from "vitest";

import { calculateSyncWriteCounts } from "@/lib/orders/sync";

describe("calculateSyncWriteCounts", () => {
  it("splits incoming ids into inserted and updated counts", () => {
    const counts = calculateSyncWriteCounts(
      new Set(["101", "102"]),
      ["101", "103", "104"],
    );

    expect(counts).toEqual({
      insertedCount: 2,
      updatedCount: 1,
    });
  });
});
