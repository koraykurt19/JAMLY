import {
  adminErrorResponse,
  noStoreHeaders,
  requireCapability,
  sanitizeSearch
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * Read-only view of the append-only admin audit log. There is deliberately no
 * write or delete endpoint: rows are created by `record_admin_action` inside
 * the database and a trigger rejects any UPDATE or DELETE.
 */
export async function GET(request: Request) {
  try {
    const { client } = await requireCapability(request, "audit.view");
    const url = new URL(request.url);

    const action = sanitizeSearch(url.searchParams.get("action"));
    const targetType = sanitizeSearch(url.searchParams.get("targetType"));
    const page = Math.max(Number(url.searchParams.get("page") ?? "0"), 0);
    const from = page * PAGE_SIZE;

    let query = client
      .from("admin_audit_log")
      .select(
        "id,actor_id,actor_role,action,target_type,target_id," +
          "before_summary,after_summary,reason,result,created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (action) query = query.ilike("action", `%${action}%`);
    if (targetType) query = query.eq("target_type", targetType);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return Response.json(
      {
        entries: data ?? [],
        total: count ?? 0,
        page,
        pageSize: PAGE_SIZE,
        hasMore: (count ?? 0) > from + PAGE_SIZE
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
