import {
  adminErrorResponse,
  assertUuid,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

const retentionPlans = new Set(["standard", "premium"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    assertUuid(id, "user id");

    const { client } = await requireCapability(request, "admin.manage");
    const body = await request.json().catch(() => null);
    const plan = typeof body?.plan === "string" ? body.plan : "";
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 240) : null;

    if (!retentionPlans.has(plan)) {
      return Response.json(
        { error: "invalid_retention_plan", message: "Retention plan is invalid." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { error } = await client.rpc("admin_set_retention_plan", {
      p_profile_id: id,
      p_plan: plan,
      p_reason: reason
    });

    if (error) throw error;

    return Response.json(
      {
        ok: true,
        plan,
        retentionMultiplier: plan === "premium" ? 2 : 1
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
