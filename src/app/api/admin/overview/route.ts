import {
  adminErrorResponse,
  noStoreHeaders,
  requireAdmin
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const { data, error } = await client.rpc("get_admin_overview");

    if (error) {
      throw error;
    }

    return Response.json(
      { overview: data?.[0] ?? null },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
