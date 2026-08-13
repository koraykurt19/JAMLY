import {
  adminErrorResponse,
  assertUuid,
  noStoreHeaders,
  requireAdmin
} from "@/lib/server/admin";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const accountStatuses = new Set(["active", "suspended", "banned"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "user id");
    const { client } = await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const status = typeof body?.status === "string" ? body.status : "";

    if (!accountStatuses.has(status)) {
      return Response.json(
        { error: "invalid_status", message: "Account status is invalid." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { error } = await client.rpc("admin_set_profile_status", {
      p_profile_id: id,
      p_status: status as Database["public"]["Enums"]["account_status"]
    });

    if (error) throw error;

    return Response.json({ ok: true }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
