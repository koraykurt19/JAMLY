import {
  adminErrorResponse,
  assertUuid,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "user id");

    const { client } = await requireCapability(request, "admin.manage");
    const body = await request.json().catch(() => null);
    const isActive = typeof body?.isActive === "boolean" ? body.isActive : null;
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 240) : null;

    if (isActive === null) {
      return Response.json(
        { error: "invalid_beta_access", message: "Beta access state is invalid." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { data, error } = await client.rpc("admin_set_beta_access", {
      p_profile_id: id,
      p_is_active: isActive,
      p_reason: reason
    });

    if (error) throw error;

    return Response.json(
      {
        ok: true,
        isActive: data === true
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
