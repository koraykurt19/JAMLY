import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SupabaseHealth =
  | { status: "not_configured" }
  | { status: "ready" }
  | { status: "schema_missing"; message: string }
  | { status: "unreachable"; message: string };

type BuildHealth =
  | { status: "current"; buildId: string; sourceRevision: string | null }
  | { status: "stale"; buildId: string; sourceRevision: string }
  | { status: "unknown"; buildId: string | null; sourceRevision: string | null };

export async function GET() {
  const supabase = await checkSupabase();
  const build = checkBuild();

  return NextResponse.json(
    {
      app: "jamly",
      ok: supabase.status === "ready" || supabase.status === "not_configured",
      deployment: deploymentTarget(),
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

function deploymentTarget() {
  const explicit = process.env.JAMLY_DEPLOYMENT?.trim();
  if (explicit) return explicit;
  return process.env.VERCEL ? "vercel" : "self-hosted";
}

function checkBuild(): BuildHealth {
  const buildId = readNextBuildId();
  const sourceRevision = readSourceRevision();

  if (!buildId) {
    return { status: "unknown", buildId: null, sourceRevision };
  }

  if (sourceRevision && buildId !== sourceRevision) {
    return { status: "stale", buildId, sourceRevision };
  }

  return { status: "current", buildId, sourceRevision };
}

function readNextBuildId() {
  return readText(join(process.cwd(), ".next", "BUILD_ID"));
}

function readSourceRevision() {
  return (
    cleanRevision(process.env.JAMLY_SOURCE_REVISION) ||
    cleanRevision(process.env.VERCEL_GIT_COMMIT_SHA) ||
    readGitHead()
  );
}

function readGitHead() {
  const gitDirectory = join(process.cwd(), ".git");
  const head = readText(join(gitDirectory, "HEAD"));
  if (!head) return null;

  if (!head.startsWith("ref:")) {
    return cleanRevision(head);
  }

  const ref = head.slice(4).trim();
  return readText(join(gitDirectory, ref)) || readPackedRef(gitDirectory, ref);
}

function readPackedRef(gitDirectory: string, ref: string) {
  const packedRefs = readText(join(gitDirectory, "packed-refs"));
  if (!packedRefs) return null;

  for (const line of packedRefs.split("\n")) {
    if (line.startsWith("#") || !line.trim()) continue;
    const [revision, packedRef] = line.trim().split(/\s+/, 2);
    if (packedRef === ref) return cleanRevision(revision);
  }

  return null;
}

function readText(path: string) {
  try {
    if (!existsSync(path)) return null;
    return cleanRevision(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function cleanRevision(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
