import {
  adminErrorResponse,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { opsRunHealth } from "@/lib/ops-run-health";

export const dynamic = "force-dynamic";
const RUN_LIMIT = 8;
const storageReportDir = resolve(process.cwd(), "work", "storage-retention-runs");

export async function GET(request: Request) {
  try {
    const { client } = await requireCapability(request, "admin.manage");
    const { data, error } = await client.rpc("admin_retention_plan", {
      p_execute: false
    });

    if (error) throw error;
    const runs = await listRetentionRuns(client);
    const storageAudit = readLatestStorageAudit();
    const health = opsRunHealth({ retentionRuns: runs, storageAudit });

    return Response.json({ plan: data, runs, storageAudit, health }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { client } = await requireCapability(request, "admin.manage");
    const body = (await request.json().catch(() => ({}))) as { confirm?: string };

    if (body.confirm !== "RUN_RETENTION_CLEANUP") {
      return Response.json(
        {
          error: "confirmation_required",
          message: "Retention cleanup requires explicit confirmation."
        },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { data, error } = await client.rpc("admin_retention_plan", {
      p_execute: true
    });

    if (error) throw error;
    const runs = await listRetentionRuns(client);
    const storageAudit = readLatestStorageAudit();
    const health = opsRunHealth({ retentionRuns: runs, storageAudit });

    return Response.json({ plan: data, runs, storageAudit, health }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

async function listRetentionRuns(client: Awaited<ReturnType<typeof requireCapability>>["client"]) {
  const { data, error } = await client
    .from("retention_policy_runs")
    .select("id,mode,status,summary,error_message,created_at")
    .order("created_at", { ascending: false })
    .limit(RUN_LIMIT);

  if (error) throw error;
  return data ?? [];
}

function readLatestStorageAudit() {
  if (!existsSync(storageReportDir)) return null;

  const latest = readdirSync(storageReportDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const path = resolve(storageReportDir, name);
      return {
        name,
        path,
        mtimeMs: statSync(path).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0];

  if (!latest) return null;

  try {
    const report = JSON.parse(readFileSync(latest.path, "utf8")) as Record<string, unknown>;
    return {
      fileName: latest.name,
      checkedAt: String(report.checkedAt ?? ""),
      mode: report.mode === "execute" ? "execute" : "dry_run",
      orphanGraceDays: Number(report.orphanGraceDays ?? 0),
      inspectedObjects: Number(report.inspectedObjects ?? 0),
      protectedObjects: Number(report.protectedObjects ?? 0),
      orphanObjects: Number(report.orphanObjects ?? 0),
      deletionCandidates: Number(report.deletionCandidates ?? 0),
      orphanBytes: Number(report.orphanBytes ?? 0),
      deletionCandidateBytes: Number(report.deletionCandidateBytes ?? 0),
      deletedObjects: Number(report.deletedObjects ?? 0),
      deletedBytes: Number(report.deletedBytes ?? 0),
      buckets: Array.isArray(report.buckets) ? report.buckets.slice(0, 8) : []
    };
  } catch (error) {
    return {
      fileName: latest.name,
      checkedAt: "",
      mode: "dry_run",
      orphanGraceDays: 0,
      inspectedObjects: 0,
      protectedObjects: 0,
      orphanObjects: 0,
      deletionCandidates: 0,
      orphanBytes: 0,
      deletionCandidateBytes: 0,
      deletedObjects: 0,
      deletedBytes: 0,
      buckets: [],
      error: error instanceof Error ? error.message : "Storage audit report could not be parsed."
    };
  }
}
