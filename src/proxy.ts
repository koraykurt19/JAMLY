import type { NextRequest } from "next/server";
import { enforceStagingAuth } from "@/lib/staging-auth";
import { updateSupabaseSession } from "@/lib/supabase-middleware";

export async function proxy(request: NextRequest) {
  // The gate runs before anything else: an unauthenticated visitor to a test
  // deployment must not reach the app, and must not cost us a Supabase call.
  const gate = await enforceStagingAuth(request);
  if (gate) return gate;

  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|otf)$).*)"
  ]
};
