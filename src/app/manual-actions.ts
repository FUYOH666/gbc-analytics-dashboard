"use server";

import { revalidatePath } from "next/cache";

import { importMockOrdersToRetailCrm } from "@/lib/orders/import";
import { syncRetailCrmOrders } from "@/lib/orders/sync";

export async function runManualImportAction() {
  await importMockOrdersToRetailCrm();
  revalidatePath("/");
}

export async function runManualSyncAction() {
  await syncRetailCrmOrders("manual");
  revalidatePath("/");
}
