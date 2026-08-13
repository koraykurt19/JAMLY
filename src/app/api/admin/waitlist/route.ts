import {
  adminErrorResponse,
  noStoreHeaders,
  requireCapability,
  sanitizeSearch
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const allowedStatuses = [
  "pending",
  "verified",
  "invited",
  "converted",
  "suppressed",
  "blocked"
] as const;

export async function GET(request: Request) {
  try {
    const { client } = await requireCapability(request, "waitlist.manage");
    const url = new URL(request.url);

    const search = sanitizeSearch(url.searchParams.get("q"));
    const status = url.searchParams.get("status");
    const flagged = url.searchParams.get("flagged") === "true";
    const page = Math.max(Number(url.searchParams.get("page") ?? "0"), 0);
    const from = page * PAGE_SIZE;

    let query = client
      .from("waitlist_entries")
      .select(
        "id,email,display_name,reserved_username,persona,locale,status,queue_position," +
          "referral_code,referral_count,risk_flags,utm_source,utm_campaign," +
          "verified_at,invited_at,converted_at,created_at",
        { count: "exact" }
      )
      .order("queue_position", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,display_name.ilike.%${search}%,reserved_username.ilike.%${search}%`
      );
    }
    // Narrow through the literal union so the filter value is validated, not cast.
    const validStatus = allowedStatuses.find((value) => value === status);
    if (validStatus) query = query.eq("status", validStatus);
    if (flagged) {
      query = query.not("risk_flags", "eq", "{}");
    }

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
