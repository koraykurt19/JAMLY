import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
let browserClient: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient<Database>(config.url, config.anonKey);
  }

  return browserClient;
}

export type JamlySupabaseClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>;

export function isSupabaseRecoverableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid api key") ||
    normalized.includes("api key") ||
    normalized.includes("auth session missing") ||
    normalized.includes("jwt") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror")
  );
}

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) return null;

  try {
    const parsedUrl = new URL(supabaseUrl);
    const isHttp = parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
    if (!isHttp || parsedUrl.hostname.length < 4) return null;
  } catch {
    return null;
  }

  if (supabaseAnonKey.length < 40) return null;
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

function isPlaceholderValue(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("your-") ||
    normalized.includes("example") ||
    normalized.includes("placeholder") ||
    normalized.includes("supabase-anon-key")
  );
}
