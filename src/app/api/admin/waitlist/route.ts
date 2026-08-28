import {
  adminErrorResponse,
  noStoreHeaders,
  requireCapability,
  sanitizeSearch
} from "@/lib/server/admin";
import { waitlistStatuses } from "@/lib/waitlist-admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
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
          "launch_signal,verified_at,invited_at,converted_at,created_at",
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
    const validStatus = waitlistStatuses.find((value) => value === status);
    if (validStatus) query = query.eq("status", validStatus);
    if (flagged) {
      query = query.not("risk_flags", "eq", "{}");
    }

    const [entriesResult, summary] = await Promise.all([query, getWaitlistSummary(client)]);
    const { data, count, error } = entriesResult;
    if (error) throw new Error(error.message);

    return Response.json(
      {
        entries: data ?? [],
        total: count ?? 0,
        page,
        pageSize: PAGE_SIZE,
        hasMore: (count ?? 0) > from + PAGE_SIZE,
        summary
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

async function getWaitlistSummary(client: Awaited<ReturnType<typeof requireCapability>>["client"]) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const count = async (filters: CountFilter[] = []) => {
    let query = client.from("waitlist_entries").select("id", { count: "exact", head: true });

    for (const filter of filters) {
      if (filter.type === "eq") query = query.eq(filter.column, filter.value);
      if (filter.type === "gt") query = query.gt(filter.column, filter.value);
      if (filter.type === "gte") query = query.gte(filter.column, filter.value);
      if (filter.type === "notEq") query = query.not(filter.column, "eq", filter.value);
    }

    const result = await query;
    if (result.error) throw new Error(result.error.message);
    return result.count ?? 0;
  };

  const [
    total,
    pending,
    verified,
    invited,
    converted,
    blocked,
    flagged,
    creator,
    buyer,
    both,
    joinedLast24h,
    referrals
  ] = await Promise.all([
    count(),
    count([{ type: "eq", column: "status", value: "pending" }]),
    count([{ type: "eq", column: "status", value: "verified" }]),
    count([{ type: "eq", column: "status", value: "invited" }]),
    count([{ type: "eq", column: "status", value: "converted" }]),
    count([{ type: "eq", column: "status", value: "blocked" }]),
    count([{ type: "notEq", column: "risk_flags", value: "{}" }]),
    count([{ type: "eq", column: "persona", value: "creator" }]),
    count([{ type: "eq", column: "persona", value: "buyer" }]),
    count([{ type: "eq", column: "persona", value: "both" }]),
    count([{ type: "gte", column: "created_at", value: since }]),
    count([{ type: "gt", column: "referral_count", value: "0" }])
  ]);

  return {
    total,
    statuses: { pending, verified, invited, converted, blocked },
    personas: { creator, buyer, both },
    flagged,
    joinedLast24h,
    withReferrals: referrals,
    triage: {
      inviteReady: verified,
      growthLeads: referrals,
      needsReview: flagged + blocked,
      conversionBacklog: invited
    }
  };
}

type CountFilter =
  | { type: "eq"; column: string; value: string }
  | { type: "gt"; column: string; value: string }
  | { type: "gte"; column: string; value: string }
  | { type: "notEq"; column: string; value: string };
