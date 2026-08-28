import {
  adminErrorResponse,
  AdminApiError,
  assertUuid,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";
import { createServiceRoleClient } from "@/lib/server/supabase-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "waitlist entry id");

    const { client } = await requireCapability(request, "admin.manage");
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 240)
        : "Admin converted waitlist entry to beta access.";

    const { data: entry, error: entryError } = await client
      .from("waitlist_entries")
      .select("id,email,reserved_username,display_name,status,converted_profile_id")
      .eq("id", id)
      .maybeSingle();
    if (entryError) throw entryError;
    if (!entry) throw new AdminApiError(404, "waitlist_entry_not_found", "Waitlist entry was not found.");
    if (entry.converted_profile_id) {
      return Response.json(
        { ok: true, status: "converted", profileId: entry.converted_profile_id, alreadyConverted: true },
        { headers: noStoreHeaders() }
      );
    }
    if (entry.status === "blocked" || entry.status === "suppressed") {
      throw new AdminApiError(409, "waitlist_entry_not_convertible", "This waitlist entry is not eligible for conversion.");
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) throw new AdminApiError(503, "service_role_not_configured", "Service role client is not configured.");

    const user = await findAuthUserByEmail(serviceClient, entry.email);
    if (!user?.id) {
      throw new AdminApiError(404, "matching_account_not_found", "No auth account exists for this waitlist email yet.");
    }

    await ensureProfile(serviceClient, {
      id: user.id,
      email: entry.email,
      displayName: entry.display_name,
      reservedUsername: entry.reserved_username
    });

    const { data: betaAccess, error: betaError } = await client.rpc("admin_set_beta_access", {
      p_profile_id: user.id,
      p_is_active: true,
      p_reason: reason
    });
    if (betaError) throw betaError;

    const now = new Date().toISOString();
    const { error: updateError } = await serviceClient
      .from("waitlist_entries")
      .update({
        status: "converted",
        converted_at: now,
        converted_profile_id: user.id,
        verified_at: now
      })
      .eq("id", id);
    if (updateError) throw updateError;

    await serviceClient
      .from("launch_invites")
      .update({ redeemed_at: now, redeemed_by: user.id })
      .eq("entry_id", id)
      .is("redeemed_at", null);

    await recordWaitlistConverted(serviceClient, id, user.id, reason);
    await client.rpc("record_admin_action", {
      p_action: "waitlist.converted",
      p_target_type: "waitlist_entry",
      p_target_id: id,
      p_before: { status: entry.status },
      p_after: { status: "converted", profile_id: user.id, beta_access: betaAccess === true },
      p_reason: reason
    });

    return Response.json(
      { ok: true, status: "converted", profileId: user.id, betaAccess: betaAccess === true },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

async function findAuthUserByEmail(
  client: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  email: string
) {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function ensureProfile(
  client: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  input: {
    id: string;
    email: string;
    displayName: string | null;
    reservedUsername: string | null;
  }
) {
  const { data: existing, error: existingError } = await client
    .from("profiles")
    .select("id")
    .eq("id", input.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return;

  const { error } = await client.from("profiles").insert({
    id: input.id,
    role: "buyer",
    handle: await availableHandle(client, input.reservedUsername ?? input.email.split("@")[0] ?? "jamly"),
    full_name: input.displayName?.trim() || input.email
  });
  if (error) throw error;
}

async function availableHandle(
  client: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  value: string
) {
  const base = normalizeHandle(value) || "jamly";
  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index}`.slice(0, 32);
    const { data, error } = await client
      .from("profiles")
      .select("id")
      .eq("handle", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  return `${base.slice(0, 23)}-${Date.now().toString(36)}`.slice(0, 32);
}

async function recordWaitlistConverted(
  client: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  entryId: string,
  profileId: string,
  reason: string
) {
  const { error } = await (client as never as {
    from(table: "waitlist_events"): {
      insert(values: {
        entry_id: string;
        event_type: "converted";
        metadata: { profile_id: string; reason: string };
      }): Promise<{ error: Error | null }>;
    };
  })
    .from("waitlist_events")
    .insert({
      entry_id: entryId,
      event_type: "converted",
      metadata: { profile_id: profileId, reason }
    });
  if (error) throw error;
}

function normalizeHandle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
