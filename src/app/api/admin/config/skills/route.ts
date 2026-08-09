import {
  adminErrorResponse,
  noStoreHeaders,
  requireAdmin
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const { data, error } = await client
      .from("platform_skills")
      .select("id, slug, category_key, label, synonyms, is_active, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("slug", { ascending: true });

    if (error) throw error;

    return Response.json({ skills: data ?? [] }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
