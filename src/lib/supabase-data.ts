import type { Database } from "@/lib/database.types";
import {
  fetchConversationMessages,
  findOrCreateOrderConversation,
  sendConversationMessage
} from "@/lib/messaging-data";
import type { ChatMessage } from "@/lib/messaging-types";
import {
  fromDatabaseLicenseTier,
  getBeatDeliveryPath,
  toDatabaseLicenseTier
} from "@/lib/beat-licenses";
import type {
  BeatLicenseTier,
  Creator,
  Listing,
  OrderRequest,
  Role
} from "@/lib/types";
import { socialLinksFromRecord } from "@/lib/social-links";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SupabaseClient = ReturnType<typeof getSupabaseBrowserClient>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type OrderRow = Database["public"]["Tables"]["order_requests"]["Row"];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80";
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80";

export type OrderSummary = OrderRequest & {
  buyerId: string;
  creatorId: string;
  brief: string;
  statusCode: OrderRow["status"];
};

export type OrderMessage = ChatMessage;

export type OrderDetail = {
  order: OrderSummary;
  listing: Listing | null;
  messages: OrderMessage[];
  conversationId: string | null;
  currentUserId: string;
};

export async function getCurrentProfile(client: SupabaseClient) {
  assertClient(client);
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { user, profile };
}

export async function ensureCurrentProfile(client: SupabaseClient) {
  assertClient(client);
  const { user, profile } = await getCurrentProfile(client);

  if (!user || profile) {
    return { user, profile };
  }

  const emailPrefix = user.email?.split("@")[0] ?? "jamly";
  const metadata = user.user_metadata;
  const rawHandle =
    typeof metadata.handle === "string" && metadata.handle.trim()
      ? metadata.handle
      : emailPrefix;
  const fullName =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name
      : user.email ?? "Jamly user";
  const fallbackProfile: ProfileInsert = {
    id: user.id,
    role: "buyer",
    handle: normalizeHandle(rawHandle),
    full_name: fullName
  };

  const { data, error } = await client
    .from("profiles")
    .insert(fallbackProfile)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { user, profile: data };
}

export async function fetchMarketplaceListings(client: SupabaseClient) {
  assertClient(client);
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateListings(client, data);
}

export async function fetchListing(client: SupabaseClient, listingId: string) {
  assertClient(client);
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [listing] = await hydrateListings(client, [data]);
  return listing ?? null;
}

export async function fetchCreatorListings(client: SupabaseClient, creatorId: string) {
  assertClient(client);
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateListings(client, data);
}

export async function fetchCreator(client: SupabaseClient, creatorId: string) {
  assertClient(client);
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", creatorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileToCreator(data) : null;
}

export async function fetchCreatorByHandle(client: SupabaseClient, handle: string) {
  assertClient(client);
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileToCreator(data) : null;
}

export async function fetchCreators(client: SupabaseClient) {
  assertClient(client);
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapProfileToCreator);
}

export async function fetchOrderSummaries(
  client: SupabaseClient,
  userId: string,
  role: Role
) {
  assertClient(client);
  const query = client.from("order_requests").select("*").order("created_at", {
    ascending: false
  });
  const { data, error } =
    role === "creator"
      ? await query.eq("creator_id", userId)
      : await query.eq("buyer_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateOrders(client, data);
}

export async function fetchOrderDetail(
  client: SupabaseClient,
  orderId: string,
  currentUserId: string
): Promise<OrderDetail | null> {
  assertClient(client);
  const { data: orderRow, error: orderError } = await client
    .from("order_requests")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!orderRow) {
    return null;
  }

  const [orders, listing, conversation] = await Promise.all([
    hydrateOrders(client, [orderRow]),
    fetchListing(client, orderRow.listing_id),
    client
      .from("conversations")
      .select("id")
      .eq("order_request_id", orderId)
      .maybeSingle()
  ]);

  const order = orders[0];
  if (!order) {
    return null;
  }

  if (conversation.error) {
    throw new Error(conversation.error.message);
  }
  const conversationId = conversation.data?.id ?? null;
  const messages = conversationId
    ? await fetchConversationMessages(client, conversationId)
    : [];

  return { order, listing, messages, conversationId, currentUserId };
}

export async function sendOrderMessage(
  client: SupabaseClient,
  order: OrderSummary,
  senderId: string,
  body: string
) {
  assertClient(client);
  const conversationId = await findOrCreateOrderConversation(client, {
    orderRequestId: order.id,
    buyerId: order.buyerId,
    artistId: order.creatorId,
    listingId: order.listingId
  });
  return sendConversationMessage(client, conversationId, senderId, body);
}

export async function purchaseBeatLicense(
  client: SupabaseClient,
  listingId: string,
  licenseTier: BeatLicenseTier,
  message: string | null
) {
  assertClient(client);
  const { data, error } = await client.rpc("purchase_listing_license", {
    p_listing_id: listingId,
    p_license_tier: toDatabaseLicenseTier(licenseTier),
    p_message: message
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createLicenseDownloadUrl(
  client: SupabaseClient,
  listing: Listing,
  licenseTier: BeatLicenseTier
) {
  assertClient(client);
  const path = getBeatDeliveryPath(listing, licenseTier);
  if (!path) {
    throw new Error("The delivery package is not available.");
  }

  const { data, error } = await client.storage
    .from("license-deliverables")
    .createSignedUrl(path, 60, { download: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

async function hydrateListings(client: SupabaseClient, rows: ListingRow[]) {
  assertClient(client);
  const profiles = await fetchProfiles(client, rows.map((row) => row.creator_id));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  return rows.map((row) => mapListing(row, profileMap.get(row.creator_id)));
}

async function hydrateOrders(client: SupabaseClient, rows: OrderRow[]) {
  assertClient(client);
  const [listingRows, profiles] = await Promise.all([
    fetchListingRows(client, rows.map((row) => row.listing_id)),
    fetchProfiles(
      client,
      rows.flatMap((row) => [row.buyer_id, row.creator_id])
    )
  ]);
  const listingMap = new Map(listingRows.map((listing) => [listing.id, listing]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const listing = listingMap.get(row.listing_id);
    return {
      id: row.id,
      listingId: row.listing_id,
      listingTitle: listing?.title ?? "Jamly project",
      buyerName: profileMap.get(row.buyer_id)?.full_name ?? "Buyer",
      creatorName: profileMap.get(row.creator_id)?.full_name ?? "Creator",
      price: Number(row.license_price ?? row.budget ?? listing?.price ?? 0),
      licenseTier: fromDatabaseLicenseTier(row.license_tier),
      licenseTermsVersion: row.license_terms_version,
      status: mapOrderStatus(row.status),
      createdAt: row.created_at,
      buyerId: row.buyer_id,
      creatorId: row.creator_id,
      brief: row.message ?? "",
      statusCode: row.status
    } satisfies OrderSummary;
  });
}

async function fetchProfiles(client: SupabaseClient, ids: string[]) {
  assertClient(client);
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await client.from("profiles").select("*").in("id", uniqueIds);
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function fetchListingRows(client: SupabaseClient, ids: string[]) {
  assertClient(client);
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await client.from("listings").select("*").in("id", uniqueIds);
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function mapListing(row: ListingRow, profile?: ProfileRow): Listing {
  const turnaround = row.turnaround ?? "Flexible";
  const licensePrices =
    row.category === "Beat" &&
    row.price_non_exclusive !== null &&
    row.price_unlimited !== null &&
    row.price_exclusive !== null
      ? {
          nonExclusive: Number(row.price_non_exclusive),
          unlimited: Number(row.price_unlimited),
          exclusive: Number(row.price_exclusive)
        }
      : null;
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorHandle: profile?.handle ?? row.creator_id,
    creatorName: profile?.full_name ?? "Jamly Creator",
    creatorAvatarUrl: profile?.avatar_url ?? DEFAULT_AVATAR,
    title: row.title,
    category: row.category,
    genre: row.genre,
    bpm: row.bpm,
    price: Number(row.price_non_exclusive ?? row.price),
    description: row.description,
    audioPreviewUrl: row.audio_preview_url,
    coverImageUrl: row.cover_image_url,
    licenseType: row.license_type,
    turnaround,
    tags: row.tags ?? [],
    moods: [],
    useCases: [],
    deliverySpeed: inferDeliverySpeed(turnaround),
    deliverables: row.tags?.length ? row.tags : [row.license_type],
    filesIncluded: ["Audio preview"],
    revisionPolicy: "Confirm revisions with the creator before work begins.",
    markers: [],
    licensePrices,
    deliveryFiles:
      row.category === "Beat"
        ? {
            nonExclusive: row.delivery_mp3_path,
            unlimited: row.delivery_unlimited_path,
            exclusive: row.delivery_exclusive_path
          }
        : null,
    exclusiveSold: row.exclusive_sold,
    isActive: row.is_active,
    exclusiveAvailable:
      row.category === "Beat" && row.is_active && !row.exclusive_sold,
    commercialUse: row.license_type !== "Service",
    analytics: { views: 0, saves: 0, plays: 0, conversionRate: 0 },
    createdAt: row.created_at
  };
}

export function mapProfileToCreator(profile: ProfileRow): Creator {
  const socialLinks = socialLinksFromRecord(profile.social_links);
  const profileStrength = calculateProfileStrength(profile, socialLinks.length);

  return {
    id: profile.id,
    handle: profile.handle,
    handleUpdatedAt: profile.handle_updated_at,
    name: profile.full_name,
    role: "creator",
    headline: profile.headline ?? "Independent music creator on Jamly",
    location: profile.location ?? "Remote",
    avatarUrl: profile.avatar_url ?? DEFAULT_AVATAR,
    coverUrl: profile.cover_url ?? DEFAULT_COVER,
    rating: 0,
    completedOrders: 0,
    responseTime: "24 hours",
    verified: false,
    specialties: profile.specialties ?? [],
    about: profile.bio ?? "This creator is building their Jamly portfolio.",
    bestFor: profile.specialties ?? [],
    notBestFor: [],
    workflow: [],
    requirements: [],
    faq: [],
    repeatBuyerRate: 0,
    responseRate: 0,
    profileStrength,
    socialLinks
  };
}

function calculateProfileStrength(profile: ProfileRow, socialLinkCount: number) {
  const checks = [
    Boolean(profile.full_name?.trim()),
    Boolean(profile.handle?.trim()),
    Boolean(profile.headline?.trim()),
    Boolean(profile.bio?.trim()),
    Boolean(profile.location?.trim()),
    Boolean(profile.avatar_url?.trim()),
    Boolean(profile.cover_url?.trim()),
    Boolean(profile.specialties?.length),
    socialLinkCount > 0
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function mapOrderStatus(status: OrderRow["status"]): OrderRequest["status"] {
  const statuses: Record<OrderRow["status"], OrderRequest["status"]> = {
    requested: "Requested",
    in_review: "In Review",
    delivered: "Delivered",
    cancelled: "Draft"
  };
  return statuses[status];
}

function inferDeliverySpeed(turnaround: string): Listing["deliverySpeed"] {
  const normalized = turnaround.toLowerCase();
  if (normalized.includes("instant") || normalized.includes("anında")) {
    return "instant";
  }
  if (normalized.includes("24") || normalized.includes("48")) {
    return "fast";
  }
  return "standard";
}

function normalizeHandle(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return normalized || "jamly";
}

function assertClient(
  client: SupabaseClient
): asserts client is Exclude<SupabaseClient, null> {
  if (!client) {
    throw new Error("Supabase is not configured.");
  }
}
