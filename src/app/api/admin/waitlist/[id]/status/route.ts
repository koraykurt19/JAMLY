import {
  adminErrorResponse,
  assertUuid,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";
import type { Database } from "@/lib/database.types";
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

    const { error } = await client.rpc("admin_set_waitlist_status", {
      p_entry_id: id,
      p_status: status as Database["public"]["Enums"]["waitlist_status"],
      p_reason: reason
    });

    if (error) throw error;

    return Response.json({ ok: true, status }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
