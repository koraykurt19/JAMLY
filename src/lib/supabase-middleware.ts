import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function updateSupabaseSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return launchGate(request, NextResponse.next({ request }), null);

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

  let userId: string | null = null;
  try {
    const { data, error } = await client.auth.getUser();
    userId = data.user?.id ?? null;
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

  return launchGate(request, response, userId ? { client, userId } : null);
}

type GateContext = {
  client: ReturnType<typeof createServerClient<Database>>;
  userId: string;
};

async function launchGate(
  request: NextRequest,
  response: NextResponse,
  context: GateContext | null
) {
  const host = normalizeHost(request.headers.get("host"));
  const path = request.nextUrl.pathname;
  const mainHosts = hostList(process.env.JAMLY_MAIN_HOSTS, ["getjamly.com", "www.getjamly.com"]);
  const preRegisterHosts = hostList(process.env.JAMLY_PRE_REGISTER_HOSTS, [
    "pre-register.getjamly.com"
  ]);

  if (preRegisterHosts.has(host)) {
    return gatePreRegisterHost(request, response);
  }

  if (!mainHosts.has(host)) {
    return response;
  }

  if (path === "/auth/sign-up") {
    return redirectToPreRegister(request, preRegisterHosts, response);
  }

  if (isMainPublicPath(path)) {
    return response;
  }

  if (!context) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("next", path === "/" ? "/admin" : `${path}${request.nextUrl.search}`);
    return copyCookies(response, NextResponse.redirect(signInUrl));
  }

  const allowed = await isBetaAllowed(context);
  if (allowed) return response;

  return redirectToPreRegister(request, preRegisterHosts, response);
}

function gatePreRegisterHost(request: NextRequest, response: NextResponse) {
  const path = request.nextUrl.pathname;

  if (path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/early-access";
    return copyCookies(response, NextResponse.rewrite(url));
  }

  if (path === "/verify") {
    const url = request.nextUrl.clone();
    url.pathname = "/early-access/verify";
    return copyCookies(response, NextResponse.rewrite(url));
  }

  if (isPreRegisterPublicPath(path)) {
    return response;
  }

  if (path.startsWith("/api/")) {
    return Response.json(
      { error: "pre_register_only", message: "This host only serves pre-registration." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return copyCookies(response, NextResponse.redirect(url));
}

async function isBetaAllowed({ client, userId }: GateContext) {
  const { data: isAdmin } = await client.rpc("is_current_user_admin");
  if (isAdmin) return true;

  const { data: profile } = await client
    .from("profiles")
    .select("handle, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.account_status !== "active") return false;

  const allowedHandles = hostList(process.env.JAMLY_BETA_ALLOWED_HANDLES, [
    "koraykurt",
    "hakanefe"
  ]);
  return allowedHandles.has(String(profile.handle ?? "").toLowerCase());
}

function isMainPublicPath(path: string) {
  return (
    path === "/auth/sign-in" ||
    path === "/auth/forgot-password" ||
    path === "/auth/reset-password" ||
    path === "/api/health" ||
    path.startsWith("/api/admin/") ||
    path === "/api/admin" ||
    path === "/api/payments/webhook"
  );
}

function isPreRegisterPublicPath(path: string) {
  return (
    path === "/" ||
    path === "/verify" ||
    path === "/early-access" ||
    path === "/early-access/verify" ||
    path === "/api/waitlist" ||
    path === "/api/waitlist/verify" ||
    path === "/api/health" ||
    path.startsWith("/_next/")
  );
}

function redirectToPreRegister(
  request: NextRequest,
  preRegisterHosts: Set<string>,
  response: NextResponse
) {
  const host = [...preRegisterHosts][0] ?? "pre-register.getjamly.com";
  const url = new URL("/", `https://${host}`);
  return copyCookies(response, NextResponse.redirect(url));
}

function normalizeHost(value: string | null) {
  return (value ?? "").split(":")[0]?.toLowerCase() ?? "";
}

function hostList(value: string | undefined, fallback: string[]) {
  return new Set(
    (value?.split(",") ?? fallback)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
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
