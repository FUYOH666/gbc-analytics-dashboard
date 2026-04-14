import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database";
import { hasConfiguredValue, readEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = readEnv();

  if (
    !hasConfiguredValue(env.NEXT_PUBLIC_SUPABASE_URL) ||
    !hasConfiguredValue(env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY as string;

  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
