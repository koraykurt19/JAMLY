import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Server-only Supabase client for trusted background work such as payment
 * settlement and email delivery. Never import this module from a client file.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
