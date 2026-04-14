import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RETAILCRM_BASE_URL: z.string().url().optional(),
  RETAILCRM_API_KEY: z.string().min(1).optional(),
  RETAILCRM_SITE_CODE: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_CHAT_ID: z.string().min(1).optional(),
  HIGH_VALUE_THRESHOLD_KZT: z.coerce.number().int().positive().default(50000),
  CRON_SECRET: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

const placeholderPatterns = [
  /^your[-_]/i,
  /your-project/i,
  /your-account/i,
  /your-vercel/i,
];

export function hasConfiguredValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !placeholderPatterns.some((pattern) => pattern.test(normalized));
}

export function readEnv(): AppEnv {
  return envSchema.parse(process.env);
}
