import { z } from "zod";

import { hasConfiguredValue, readEnv } from "@/lib/env";

const telegramResponseSchema = z.object({
  ok: z.boolean(),
  result: z
    .object({
      message_id: z.number(),
    })
    .optional(),
});

export async function sendTelegramMessage(text: string) {
  const env = readEnv();

  if (
    !hasConfiguredValue(env.TELEGRAM_BOT_TOKEN) ||
    !hasConfiguredValue(env.TELEGRAM_CHAT_ID)
  ) {
    throw new Error(
      "Telegram notifications require TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
    );
  }

  const telegramBotToken = env.TELEGRAM_BOT_TOKEN as string;
  const telegramChatId = env.TELEGRAM_CHAT_ID as string;

  const response = await fetch(
    `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
      }),
      cache: "no-store",
    },
  );

  const rawJson = await response.json();
  const parsed = telegramResponseSchema.parse(rawJson);

  if (!response.ok || !parsed.ok || !parsed.result) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(rawJson)}`);
  }

  return {
    chatId: telegramChatId,
    messageId: String(parsed.result.message_id),
  };
}
