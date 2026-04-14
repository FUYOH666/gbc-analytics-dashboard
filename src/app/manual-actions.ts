"use server";

import { revalidatePath } from "next/cache";

import { importMockOrdersToRetailCrm } from "@/lib/orders/import";
import { syncRetailCrmOrders } from "@/lib/orders/sync";

export async function runManualImportAction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Manual import is disabled in production.");
  }

  await importMockOrdersToRetailCrm();
  revalidatePath("/");
}

export async function runManualSyncAction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Manual sync is disabled in production.");
  }

  await syncRetailCrmOrders("manual");
  revalidatePath("/");
}
