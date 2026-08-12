import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
let browserClient: SupabaseClient<Database> | null = null;
let legacySessionMigrationStarted = false;

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(config.url, config.anonKey);
    migrateLegacyBrowserSession(browserClient, config.url);
  }

  return browserClient;
}

function migrateLegacyBrowserSession(client: SupabaseClient<Database>, url: string) {
  if (legacySessionMigrationStarted || typeof window === "undefined") return;
  legacySessionMigrationStarted = true;

  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    if (!projectRef) return;
    const rawSession = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!rawSession) return;
    const parsed = JSON.parse(rawSession) as { access_token?: unknown; refresh_token?: unknown };
    if (typeof parsed.access_token !== "string" || typeof parsed.refresh_token !== "string") return;

    void client.auth
      .setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token
      })
      .then(({ error }) => {
        if (error) window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
      })
      .catch(() => {
        window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
      });
  } catch {
    // Invalid legacy sessions are ignored; the standard signed-out flow remains available.
  }
}

export type JamlySupabaseClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>;

export function isSupabaseRecoverableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid api key") ||
    normalized.includes("api key") ||
    normalized.includes("auth session missing") ||
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    normalized.includes("pgrst205") ||
    (normalized.includes("relation") && normalized.includes("does not exist")) ||
    normalized.includes("jwt") ||
    normalized.includes("load failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror")
  );
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
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
