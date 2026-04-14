import {
  buildRetailCrmExternalId,
  buildRetailCrmUploadOrdersPayload,
  chunkOrders,
  filterOrdersForImport,
} from "@/lib/orders/import-payload";
import { readEnv } from "@/lib/env";
import { loadMockOrders } from "@/lib/mock-orders";
import {
  listRetailCrmOrdersByExternalIds,
  uploadRetailCrmOrders,
} from "@/lib/retailcrm";

export async function importMockOrdersToRetailCrm() {
  const env = readEnv();

  if (!env.RETAILCRM_SITE_CODE) {
    throw new Error("RETAILCRM_SITE_CODE is required for mock order import.");
  }

  const mockOrders = await loadMockOrders();
  const externalIds = mockOrders.map((order, index) =>
    buildRetailCrmExternalId(order, index),
  );
  const existingOrders = await listRetailCrmOrdersByExternalIds(externalIds);
  const existingExternalIds = new Set(
    existingOrders
      .map((order) => order.externalId)
      .filter((externalId): externalId is string => Boolean(externalId)),
  );
  const filtered = filterOrdersForImport(mockOrders, existingExternalIds);
  const batches = chunkOrders(filtered.missing, 50);
  const importStartedAt = new Date();
  const importedExternalIds: string[] = [];

  for (const batch of batches) {
    const payload = buildRetailCrmUploadOrdersPayload(
      batch,
      env.RETAILCRM_SITE_CODE,
      importStartedAt,
    );
    const result = await uploadRetailCrmOrders(payload.site, payload.orders);

    if (result.errors?.length) {
      throw new Error(
        `RetailCRM import returned validation errors: ${JSON.stringify(result.errors)}`,
      );
    }

    importedExternalIds.push(...payload.orders.map((order) => order.externalId));
  }

  return {
    totalMockOrders: mockOrders.length,
    alreadyExistingCount: filtered.alreadyExistingCount,
    importedCount: importedExternalIds.length,
    batchCount: batches.length,
    importedExternalIds: importedExternalIds.slice(0, 10),
  };
}
