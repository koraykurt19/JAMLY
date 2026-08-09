import {
  adminErrorResponse,
  noStoreHeaders,
  requireAdmin,
  sanitizeSearch
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

const orderStatuses = ["requested", "in_review", "delivered", "cancelled"] as const;
type OrderStatus = (typeof orderStatuses)[number];

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const url = new URL(request.url);
    const search = sanitizeSearch(url.searchParams.get("q"));
    const status = url.searchParams.get("status")?.trim() ?? "";

    let query = client
      .from("order_requests")
      .select("id, listing_id, buyer_id, creator_id, message, budget, license_tier, license_price, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (isOrderStatus(status)) {
      query = query.eq("status", status);
    }

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    const profileIds = Array.from(new Set((orders ?? []).flatMap((order) => [order.buyer_id, order.creator_id])));
    const listingIds = Array.from(new Set((orders ?? []).map((order) => order.listing_id)));
    const [{ data: profiles, error: profilesError }, { data: listings, error: listingsError }] =
      await Promise.all([
        profileIds.length
          ? client.from("profiles").select("id, handle, full_name").in("id", profileIds)
          : Promise.resolve({ data: [], error: null }),
        listingIds.length
          ? client.from("listings").select("id, title").in("id", listingIds)
          : Promise.resolve({ data: [], error: null })
      ]);

    if (profilesError) throw profilesError;
    if (listingsError) throw listingsError;

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const listingMap = new Map((listings ?? []).map((listing) => [listing.id, listing]));
    const normalizedSearch = search.toLowerCase();

    const hydrated = (orders ?? []).map((order) => {
      const buyer = profileMap.get(order.buyer_id);
      const creator = profileMap.get(order.creator_id);
      return {
        id: order.id,
        listingId: order.listing_id,
        listingTitle: listingMap.get(order.listing_id)?.title ?? "Jamly project",
        buyerId: order.buyer_id,
        buyerName: buyer?.full_name ?? "Buyer",
        creatorId: order.creator_id,
        creatorName: creator?.full_name ?? "Creator",
        status: order.status,
        licenseTier: order.license_tier,
        price: Number(order.license_price ?? order.budget ?? 0),
        createdAt: order.created_at
      };
    });

    return Response.json(
      {
        orders: normalizedSearch
          ? hydrated.filter((order) =>
              [order.listingTitle, order.buyerName, order.creatorName]
                .join(" ")
                .toLowerCase()
                .includes(normalizedSearch)
            )
          : hydrated
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}
