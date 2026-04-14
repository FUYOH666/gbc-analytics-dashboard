import { sendHighValueOrderAlerts } from "@/lib/orders/alerts";
import type { Database } from "@/lib/database";
import { mapRetailCrmOrderToRecord } from "@/lib/orders/mapper";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { listAllRetailCrmOrders } from "@/lib/retailcrm";

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type SyncRunRow = Database["public"]["Tables"]["sync_runs"]["Row"];

export function calculateSyncWriteCounts(
  existingIds: Set<string>,
  incomingIds: string[],
) {
  let updatedCount = 0;

  for (const incomingId of incomingIds) {
    if (existingIds.has(incomingId)) {
      updatedCount += 1;
    }
  }

  return {
    insertedCount: incomingIds.length - updatedCount,
    updatedCount,
  };
}

async function markSyncRunFailure(syncRunId: string, message: string) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("sync_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("id", syncRunId);
}

export async function syncRetailCrmOrders(mode: "manual" | "cron") {
  const supabase = createSupabaseAdminClient();

  const { data: startedRunData, error: startError } = await supabase
    .from("sync_runs")
    .insert({
      mode,
      status: "running",
      metadata: {},
    })
    .select("id")
    .single();
  const startedRun = startedRunData as Pick<SyncRunRow, "id"> | null;

  if (startError || !startedRun) {
    throw new Error(`Failed to start sync run: ${startError?.message ?? "unknown error"}`);
  }

  try {
    const retailCrmOrders = await listAllRetailCrmOrders();
    const normalizedOrders = retailCrmOrders.map(
      mapRetailCrmOrderToRecord,
    ) as OrderInsert[];
    const incomingIds = normalizedOrders.map((order) => order.retailcrm_order_id);

    let existingIds = new Set<string>();

    if (incomingIds.length > 0) {
      const { data: existingOrdersData, error: selectError } = await supabase
        .from("orders")
        .select("retailcrm_order_id")
        .in("retailcrm_order_id", incomingIds);
      const existingOrders = existingOrdersData as
        | Array<Pick<OrderInsert, "retailcrm_order_id">>
        | null;

      if (selectError) {
        throw new Error(`Failed to read existing orders: ${selectError.message}`);
      }

      existingIds = new Set(
        (existingOrders ?? []).map((order) => order.retailcrm_order_id),
      );
    }

    const counts = calculateSyncWriteCounts(existingIds, incomingIds);

    if (normalizedOrders.length > 0) {
      const { error: upsertError } = await supabase
        .from("orders")
        .upsert(normalizedOrders as OrderInsert[], {
          onConflict: "retailcrm_order_id",
        })
        .select("retailcrm_order_id");

      if (upsertError) {
        throw new Error(`Failed to upsert orders: ${upsertError.message}`);
      }
    }

    const alertResult = await sendHighValueOrderAlerts(normalizedOrders);

    const { error: finishError } = await supabase
      .from("sync_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        processed_count: normalizedOrders.length,
        inserted_count: counts.insertedCount,
        updated_count: counts.updatedCount,
        metadata: {
          retailcrmOrderCount: retailCrmOrders.length,
          alertsSentCount: alertResult.sentCount,
          alertFailureCount: alertResult.failureCount,
          alertSkippedReason: alertResult.skippedReason,
        },
      })
      .eq("id", startedRun.id);

    if (finishError) {
      throw new Error(`Failed to finish sync run: ${finishError.message}`);
    }

    return {
      syncRunId: startedRun.id,
      processedCount: normalizedOrders.length,
      insertedCount: counts.insertedCount,
      updatedCount: counts.updatedCount,
      alertsSentCount: alertResult.sentCount,
      normalizedOrders,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown RetailCRM sync error";
    await markSyncRunFailure(startedRun.id, message);
    throw error;
  }
}
