import {
  adminErrorResponse,
  noStoreHeaders,
  requireCapability
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { client } = await requireCapability(request, "admin.manage");
    const { data, error } = await client.rpc("admin_retention_plan", {
      p_execute: false
    });

    if (error) throw error;

    return Response.json({ plan: data }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { client } = await requireCapability(request, "admin.manage");
    const body = (await request.json().catch(() => ({}))) as { confirm?: string };

    if (body.confirm !== "RUN_RETENTION_CLEANUP") {
      return Response.json(
        {
          error: "confirmation_required",
          message: "Retention cleanup requires explicit confirmation."
        },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const { data, error } = await client.rpc("admin_retention_plan", {
      p_execute: true
    });

    if (error) throw error;

    return Response.json({ plan: data }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
