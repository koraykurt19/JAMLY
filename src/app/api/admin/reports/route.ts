import { adminErrorResponse, assertUuid, noStoreHeaders, requireCapability } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const allowedStatuses = ["pending", "reviewing", "resolved", "dismissed"] as const;
const allowedPriorities = ["low", "normal", "high", "urgent"] as const;

export async function GET(request: Request) {
  try {
    const { client } = await requireCapability(request, "report.resolve");
    const url = new URL(request.url);

    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const page = Math.max(Number(url.searchParams.get("page") ?? "0"), 0);
    const from = page * PAGE_SIZE;

    let query = client
      .from("reports")
      .select(
        "id,reported_by,target_type,target_id,category,reason,status,priority," +
          "assigned_to,resolution,resolution_action,created_at,resolved_at",
        { count: "exact" }
      )
      // Urgent first, then oldest — the queue should surface what is aging.
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    // Narrow through the literal union so the filter value is validated, not cast.
    const validStatus = allowedStatuses.find((value) => value === status);
    if (validStatus) query = query.eq("status", validStatus);

    const validPriority = allowedPriorities.find((value) => value === priority);
    if (validPriority) query = query.eq("priority", validPriority);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return Response.json(
      { reports: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

/** Resolve or reprioritise a report. Every transition is audited server-side. */
export async function PATCH(request: Request) {
  try {
    const { client } = await requireCapability(request, "report.resolve");
    const body = (await request.json().catch(() => null)) as {
      reportId?: string;
      status?: string;
      resolution?: string;
      resolutionAction?: string;
    } | null;

    const reportId = String(body?.reportId ?? "");
    assertUuid(reportId, "reportId");

    const status = String(body?.status ?? "");
    if (!(allowedStatuses as readonly string[]).includes(status)) {
      return Response.json(
        { error: "invalid_status", message: "Unknown report status." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { error } = await client.rpc("resolve_report", {
      p_report_id: reportId,
      p_status: status,
      p_resolution: body?.resolution ?? null,
      p_resolution_action: body?.resolutionAction ?? null
    });

    if (error) throw new Error(error.message);

    return Response.json({ ok: true }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
