import {
  adminErrorResponse,
  noStoreHeaders,
  requireCapability,
  sanitizeSearch
} from "@/lib/server/admin";
import type { Database, Json } from "@/lib/database.types";
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
    const entries = (data ?? []) as unknown as WaitlistEntryRow[];
    const launchInvites = await getLaunchInviteSummaries(
      client,
      entries.map((entry) => entry.id)
    );

    return Response.json(
      {
        entries: entries.map((entry) => ({
          ...entry,
          launch_invite: launchInvites.get(entry.id) ?? null
        })),
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

async function getLaunchInviteSummaries(
  client: Awaited<ReturnType<typeof requireCapability>>["client"],
  entryIds: string[]
) {
  if (entryIds.length === 0) return new Map<string, LaunchInviteSummary>();

  const { data, error } = await client
    .from("launch_invites")
    .select("entry_id,invite_code,expires_at,redeemed_at,created_at")
    .in("entry_id", entryIds)
    .is("redeemed_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const byEntryId = new Map<string, LaunchInviteSummary>();
  for (const invite of data ?? []) {
    if (byEntryId.has(invite.entry_id)) continue;
    byEntryId.set(invite.entry_id, {
      inviteCode: invite.invite_code,
      expiresAt: invite.expires_at,
      redeemedAt: invite.redeemed_at,
      createdAt: invite.created_at
    });
  }
  return byEntryId;
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

type WaitlistEntryRow = Pick<
  Database["public"]["Tables"]["waitlist_entries"]["Row"],
  | "id"
  | "email"
  | "display_name"
  | "reserved_username"
  | "persona"
  | "locale"
  | "status"
  | "queue_position"
  | "referral_code"
  | "referral_count"
  | "risk_flags"
  | "utm_source"
  | "utm_campaign"
  | "launch_signal"
  | "verified_at"
  | "invited_at"
  | "converted_at"
  | "created_at"
> & {
  launch_signal: Json;
};

type LaunchInviteSummary = {
  inviteCode: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
};
