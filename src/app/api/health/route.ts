import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SupabaseHealth =
  | { status: "not_configured" }
  | { status: "ready" }
  | { status: "schema_missing"; message: string }
  | { status: "unreachable"; message: string };

export async function GET() {
  const supabase = await checkSupabase();
  const build = checkBuildFreshness();

  return NextResponse.json(
    {
      app: "jamly",
      ok:
        (supabase.status === "ready" || supabase.status === "not_configured") &&
        build.status === "current",
      deployment: detectDeployment(),
      supabase,
      build,
      checkedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

/**
 * Detects the host rather than asserting one. This used to report "vercel"
 * unconditionally, which is wrong on any self-hosted deployment and misleads
 * whatever is scraping the endpoint.
 */
function detectDeployment() {
  if (process.env.VERCEL) return "vercel";
  if (process.env.WEBSITE_SITE_NAME) return "azure";
  if (process.env.KUBERNETES_SERVICE_HOST) return "kubernetes";
  return "self-hosted";
}

type BuildHealth =
  | { status: "current" }
  | { status: "stale"; message: string };

/**
 * Catches the "edited .env.local and only restarted" mistake.
 *
 * The CSP and every NEXT_PUBLIC_* value in the browser bundle are fixed at
 * build time. If the running environment now names a different Supabase host,
 * the server will talk to the new project while the browser still carries the
 * old configuration and a CSP that forbids connecting to it. The visible
 * symptom is an opaque network error, so surface it here instead.
 */
function checkBuildFreshness(): BuildHealth {
  const builtHost = process.env.JAMLY_BUILD_SUPABASE_HOST ?? "";
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

  let currentHost = "";
  if (currentUrl) {
    try {
      currentHost = new URL(currentUrl).hostname;
    } catch {
      return { status: "stale", message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL." };
    }
  }

  if (builtHost === currentHost) return { status: "current" };

  return {
    status: "stale",
    message: builtHost
      ? `Built against ${builtHost} but configured for ${currentHost || "no Supabase"}. Run npm run build again.`
      : `Configured for ${currentHost} but built without Supabase. The browser bundle and CSP still lack it — run npm run build again.`
  };
}

async function checkSupabase(): Promise<SupabaseHealth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return { status: "not_configured" };
  }

  try {
    const response = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return { status: "ready" };
    }

    const body = await readLimitedBody(response);
    if (response.status === 404 || body.includes("PGRST205") || body.includes("schema cache")) {
      return {
        status: "schema_missing",
        message: "Jamly Supabase schema has not been applied yet."
      };
    }

    return {
      status: "unreachable",
      message: `Supabase returned HTTP ${response.status}.`
    };
  } catch (error) {
    return {
      status: "unreachable",
      message: error instanceof Error ? error.message : "Supabase health check failed."
    };
  }
}

async function readLimitedBody(response: Response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500);
}
