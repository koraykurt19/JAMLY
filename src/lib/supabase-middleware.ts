import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function updateSupabaseSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  try {
    const { error } = await client.auth.getUser();
    if (error && isInvalidAuthState(error.message)) {
      clearSupabaseAuthCookies(request, response);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (isInvalidAuthState(message)) {
      clearSupabaseAuthCookies(request, response);
    } else {
      console.error("Jamly auth middleware failed", message);
    }
  }

  return response;
}

function isInvalidAuthState(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("jwt") ||
    normalized.includes("auth session missing") ||
    normalized.includes("refresh token") ||
    normalized.includes("invalid claim") ||
    normalized.includes("issued at future") ||
    normalized.includes("token is expired")
  );
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("sb-") || !cookie.name.includes("auth-token")) continue;
    request.cookies.delete(cookie.name);
    response.cookies.set(cookie.name, "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
      sameSite: "lax"
    });
  }
}
