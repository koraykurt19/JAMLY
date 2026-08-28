import {
  adminErrorResponse,
  assertUuid,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";
import type { Database } from "@/lib/database.types";
import { queueWaitlistInviteEmail } from "@/lib/server/mailer";
import { isAdminMutableWaitlistStatus } from "@/lib/waitlist-admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "waitlist entry id");

    const { client } = await requireCapability(request, "waitlist.manage");
    const body = await request.json().catch(() => null);
    const status = typeof body?.status === "string" ? body.status : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 240) : null;

    if (!isAdminMutableWaitlistStatus(status)) {
      return Response.json(
        { error: "invalid_status", message: "Waitlist status is invalid for admin action." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { data: entry, error: entryError } = await client
      .from("waitlist_entries")
      .select("email,locale,queue_position,referral_code,reserved_username,status")
      .eq("id", id)
      .maybeSingle();
    if (entryError) throw entryError;

    const { error } = await client.rpc("admin_set_waitlist_status", {
      p_entry_id: id,
      p_status: status as Database["public"]["Enums"]["waitlist_status"],
      p_reason: reason
    });

    if (error) throw error;

    let inviteEmail: Awaited<ReturnType<typeof queueWaitlistInviteEmail>> | null = null;
    if (status === "invited" && entry && entry.status !== "invited") {
      inviteEmail = await queueWaitlistInviteEmail({
        email: entry.email,
        locale: entry.locale === "en" ? "en" : "tr",
        queuePosition: Number(entry.queue_position),
        referralCode: entry.referral_code,
        reservedUsername: entry.reserved_username
      });
    }

    return Response.json(
      { ok: true, status, inviteEmail: inviteEmail?.queued ? inviteEmail.delivery : null },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
