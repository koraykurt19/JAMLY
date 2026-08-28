import {
  adminErrorResponse,
  assertUuid,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const adminRoles = new Set([
  "super_admin",
  "admin",
  "moderator",
  "support",
  "finance",
  "content_reviewer",
  "analyst"
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "user id");

    const { client } = await requireCapability(request, "admin.manage");
    const body = await request.json().catch(() => null);
    const role = typeof body?.role === "string" ? body.role : "admin";
    const isActive = typeof body?.isActive === "boolean" ? body.isActive : true;
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 240) : null;

    if (!adminRoles.has(role)) {
      return Response.json(
        { error: "invalid_role", message: "Admin role is invalid." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { error } = await client.rpc("admin_set_admin_role", {
      p_profile_id: id,
      p_role: role as Database["public"]["Enums"]["admin_role"],
      p_is_active: isActive,
      p_reason: reason
    });

    if (error) throw error;

    return Response.json({ ok: true, role, isActive }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
