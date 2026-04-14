import type { Database } from "@/lib/database";
import { hasConfiguredValue, readEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { sendTelegramMessage } from "@/lib/telegram";

type OrderAlertInsert = Database["public"]["Tables"]["order_alerts"]["Insert"];

type AlertableOrder = {
  retailcrm_order_id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  city?: string | null;
};

export function buildOrderAlertKey(orderId: string, thresholdCode: string) {
  return `${orderId}::${thresholdCode}`;
}

export function selectOrdersForAlert(
  orders: AlertableOrder[],
  thresholdAmount: number,
  thresholdCode: string,
  existingAlertKeys: Set<string>,
) {
  return orders.filter((order) => {
    if (order.total_amount < thresholdAmount) {
      return false;
    }

    return !existingAlertKeys.has(
      buildOrderAlertKey(order.retailcrm_order_id, thresholdCode),
    );
  });
}

function buildHighValueAlertMessage(order: AlertableOrder, thresholdAmount: number) {
  return [
    "High-value order detected",
    `Order ID: ${order.retailcrm_order_id}`,
    `Customer: ${order.customer_name}`,
    `Amount: ${new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(order.total_amount)} ₸`,
    `Threshold: ${new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(thresholdAmount)} ₸`,
    `Status: ${order.status}`,
    `City: ${order.city ?? "n/a"}`,
  ].join("\n");
}

export async function sendHighValueOrderAlerts(orders: AlertableOrder[]) {
  const env = readEnv();

  if (
    !hasConfiguredValue(env.TELEGRAM_BOT_TOKEN) ||
    !hasConfiguredValue(env.TELEGRAM_CHAT_ID)
  ) {
    return {
      sentCount: 0,
      failureCount: 0,
      skippedReason: "Telegram env is not configured.",
      failures: [] as Array<{ orderId: string; message: string }>,
    };
  }

  const thresholdAmount = env.HIGH_VALUE_THRESHOLD_KZT;
  const thresholdCode = `high-value-${thresholdAmount}`;
  const supabase = createSupabaseAdminClient();
  const orderIds = orders.map((order) => order.retailcrm_order_id);

  let existingAlertKeys = new Set<string>();

  if (orderIds.length > 0) {
    const { data: existingAlertsData, error } = await supabase
      .from("order_alerts")
      .select("retailcrm_order_id, threshold_code")
      .eq("threshold_code", thresholdCode)
      .in("retailcrm_order_id", orderIds);
    const existingAlerts = existingAlertsData as
      | Array<Pick<OrderAlertInsert, "retailcrm_order_id" | "threshold_code">>
      | null;

    if (error) {
      return {
        sentCount: 0,
        failureCount: 0,
        skippedReason: `Failed to read existing alerts: ${error.message}`,
        failures: [] as Array<{ orderId: string; message: string }>,
      };
    }

    existingAlertKeys = new Set(
      (existingAlerts ?? []).map((alert) =>
        buildOrderAlertKey(alert.retailcrm_order_id, alert.threshold_code),
      ),
    );
  }

  const candidates = selectOrdersForAlert(
    orders,
    thresholdAmount,
    thresholdCode,
    existingAlertKeys,
  );
  const failures: Array<{ orderId: string; message: string }> = [];
  let sentCount = 0;

  for (const order of candidates) {
    try {
      const telegramResult = await sendTelegramMessage(
        buildHighValueAlertMessage(order, thresholdAmount),
      );

      const alertInsert: OrderAlertInsert = {
        retailcrm_order_id: order.retailcrm_order_id,
        threshold_code: thresholdCode,
        threshold_amount: thresholdAmount,
        telegram_chat_id: telegramResult.chatId,
        telegram_message_id: telegramResult.messageId,
        payload: {
          status: order.status,
          total_amount: order.total_amount,
          customer_name: order.customer_name,
        },
      };

      const { error } = await supabase.from("order_alerts").insert(alertInsert);

      if (error) {
        failures.push({
          orderId: order.retailcrm_order_id,
          message: error.message,
        });
        continue;
      }

      sentCount += 1;
    } catch (error) {
      failures.push({
        orderId: order.retailcrm_order_id,
        message: error instanceof Error ? error.message : "Unknown alert error",
      });
    }
  }

  return {
    sentCount,
    failureCount: failures.length,
    skippedReason: candidates.length === 0 ? "No new high-value orders to alert." : null,
    failures,
  };
}
