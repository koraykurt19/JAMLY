import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SupabaseHealth =
  | { status: "not_configured" }
  | { status: "ready" }
  | { status: "schema_missing"; message: string }
  | { status: "unreachable"; message: string };

export async function GET() {
  const supabase = await checkSupabase();

  return NextResponse.json(
    {
      app: "jamly",
      ok: supabase.status === "ready" || supabase.status === "not_configured",
      deployment: "vercel",
      supabase,
      checkedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
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
