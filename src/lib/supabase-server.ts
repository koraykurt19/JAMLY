import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "@/lib/supabase";

export async function getSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware handles refreshes.
        }
      }
    }
  });
}

export async function requireServerUser(nextPath: string) {
  const client = await getSupabaseServerClient();
  if (!client) return { client: null, user: null, redirectTo: null };

  const {
    data: { user }
  } = await client.auth.getUser();

  return {
    client,
    user,
    redirectTo: user
      ? null
      : `/auth/sign-in?next=${encodeURIComponent(nextPath)}`
  };
}
