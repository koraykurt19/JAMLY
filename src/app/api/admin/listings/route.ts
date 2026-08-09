import {
  adminErrorResponse,
  noStoreHeaders,
  requireAdmin,
  sanitizeSearch
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const url = new URL(request.url);
    const search = sanitizeSearch(url.searchParams.get("q"));
    const state = url.searchParams.get("state")?.trim() ?? "";

    let query = client
      .from("listings")
      .select("id, creator_id, title, category, genre, price, license_type, is_active, exclusive_sold, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (state === "active") query = query.eq("is_active", true);
    if (state === "inactive") query = query.eq("is_active", false);
    if (search) query = query.or(`title.ilike.%${search}%,genre.ilike.%${search}%`);

    const { data: listings, error: listingsError } = await query;
    if (listingsError) throw listingsError;

    const creatorIds = Array.from(new Set((listings ?? []).map((listing) => listing.creator_id)));
    const { data: profiles, error: profilesError } = creatorIds.length
      ? await client.from("profiles").select("id, handle, full_name").in("id", creatorIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return Response.json(
      {
        listings: (listings ?? []).map((listing) => {
          const creator = profileMap.get(listing.creator_id);
          return {
            id: listing.id,
            title: listing.title,
            category: listing.category,
            genre: listing.genre,
            price: Number(listing.price),
            licenseType: listing.license_type,
            isActive: listing.is_active,
            exclusiveSold: listing.exclusive_sold,
            creatorId: listing.creator_id,
            creatorHandle: creator?.handle ?? listing.creator_id,
            creatorName: creator?.full_name ?? "Jamly Creator",
            createdAt: listing.created_at
          };
        })
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
