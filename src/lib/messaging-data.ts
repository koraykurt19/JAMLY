import { creators, listings } from "@/lib/data";
import type { Database } from "@/lib/database.types";
import type { Language } from "@/lib/i18n";
import type {
  ChatMessage,
  ConversationListing,
  ConversationParticipant,
  ConversationSummary
} from "@/lib/messaging-types";
import type { JamlySupabaseClient } from "@/lib/supabase";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80";

export const DEMO_CURRENT_USER_ID = "demo-buyer-jules";

export async function fetchConversations(
  client: JamlySupabaseClient,
  currentUserId: string
): Promise<ConversationSummary[]> {
  const { data: rows, error } = await client
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${currentUserId},artist_id.eq.${currentUserId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (rows.length === 0) return [];

  const profileIds = rows.flatMap((row) => [row.buyer_id, row.artist_id]);
  const listingIds = rows
    .map((row) => row.listing_id)
    .filter((id): id is string => Boolean(id));
  const conversationIds = rows.map((row) => row.id);
  const [profiles, listingRows, unreadRows] = await Promise.all([
    fetchProfiles(client, profileIds),
    fetchListings(client, listingIds),
    fetchUnreadMessages(client, conversationIds, currentUserId)
  ]);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const listingMap = new Map(listingRows.map((listing) => [listing.id, listing]));
  const unreadMap = unreadRows.reduce<Map<string, number>>((counts, message) => {
    counts.set(message.conversation_id, (counts.get(message.conversation_id) ?? 0) + 1);
    return counts;
  }, new Map());

  return rows.map((row) =>
    mapConversation(
      row,
      currentUserId,
      profileMap,
      listingMap,
      unreadMap.get(row.id) ?? 0
    )
  );
}

export async function fetchConversationMessages(
  client: JamlySupabaseClient,
  conversationId: string
): Promise<ChatMessage[]> {
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map(mapMessage);
}

export async function sendConversationMessage(
  client: JamlySupabaseClient,
  conversationId: string,
  senderId: string,
  body: string
): Promise<ChatMessage> {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error("Message cannot be empty.");

  const { data, error } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: trimmedBody,
      message_type: "text"
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapMessage(data);
}

export async function markConversationRead(
  client: JamlySupabaseClient,
  conversationId: string,
  currentUserId: string
) {
  const { error } = await client
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("is_read", false)
    .neq("sender_id", currentUserId);

  if (error) throw new Error(error.message);
}

export async function findOrCreateMarketplaceConversation(
  client: JamlySupabaseClient,
  artistId: string,
  listingId: string | null
) {
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("AUTH_REQUIRED");

  if (authData.user.id === artistId) throw new Error("SELF_CONVERSATION");

  const existing = await findMarketplaceConversation(
    client,
    authData.user.id,
    artistId,
    listingId
  );
  if (existing) return existing.id;

  const { data, error } = await client
    .from("conversations")
    .insert({
      buyer_id: authData.user.id,
      artist_id: artistId,
      listing_id: listingId
    })
    .select("id")
    .single();

  if (!error) return data.id;
  if (error.code === "23505") {
    const racedConversation = await findMarketplaceConversation(
      client,
      authData.user.id,
      artistId,
      listingId
    );
    if (racedConversation) return racedConversation.id;
  }
  throw new Error(error.message);
}

export async function findOrCreateOrderConversation(
  client: JamlySupabaseClient,
  input: {
    orderRequestId: string;
    buyerId: string;
    artistId: string;
    listingId: string;
  }
) {
  const { data: existing, error: existingError } = await client
    .from("conversations")
    .select("id")
    .eq("order_request_id", input.orderRequestId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing.id;

  const { data, error } = await client
    .from("conversations")
    .insert({
      buyer_id: input.buyerId,
      artist_id: input.artistId,
      listing_id: input.listingId,
      order_request_id: input.orderRequestId
    })
    .select("id")
    .single();

  if (!error) return data.id;
  if (error.code === "23505") {
    const { data: racedConversation, error: racedError } = await client
      .from("conversations")
      .select("id")
      .eq("order_request_id", input.orderRequestId)
      .single();
    if (racedError) throw new Error(racedError.message);
    return racedConversation.id;
  }
  throw new Error(error.message);
}

export function getDemoConversations(language: Language): ConversationSummary[] {
  const now = Date.now();
  const listingConversations = listings.map((listing, index) => ({
    id: `demo-${listing.id}`,
    buyerId: DEMO_CURRENT_USER_ID,
    artistId: listing.creatorId,
    listingId: listing.id,
    orderRequestId: null,
    otherUser: {
      id: listing.creatorId,
      name: listing.creatorName,
      handle: listing.creatorHandle,
      avatarUrl: listing.creatorAvatarUrl,
      role: "creator" as const
    },
    listing: {
      id: listing.id,
      title: listing.title,
      coverImageUrl: listing.coverImageUrl,
      creatorId: listing.creatorId
    },
    lastMessage:
      language === "tr"
        ? index % 2 === 0
          ? "Brief'i dinledim, iki yön önerebilirim."
          : "Teslim kapsamını birlikte netleştirelim."
        : index % 2 === 0
          ? "I listened to the brief and can suggest two directions."
          : "Let's confirm the delivery scope together.",
    lastMessageAt: new Date(now - index * 3_600_000).toISOString(),
    createdAt: new Date(now - (index + 1) * 86_400_000).toISOString(),
    unreadCount: index < 2 ? index + 1 : 0,
    isDemo: true
  }));
  const generalConversations = creators.map((creator, index) => ({
    id: `demo-artist-${creator.id}`,
    buyerId: DEMO_CURRENT_USER_ID,
    artistId: creator.id,
    listingId: null,
    orderRequestId: null,
    otherUser: {
      id: creator.id,
      name: creator.name,
      handle: creator.handle,
      avatarUrl: creator.avatarUrl,
      role: "creator" as const
    },
    listing: null,
    lastMessage:
      language === "tr" ? "Yeni projen için nasıl yardımcı olabilirim?" : "How can I help with your next project?",
    lastMessageAt: new Date(now - (index + 12) * 3_600_000).toISOString(),
    createdAt: new Date(now - (index + 4) * 86_400_000).toISOString(),
    unreadCount: 0,
    isDemo: true
  }));

  return [...listingConversations, ...generalConversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function getDemoMessages(conversationId: string, language: Language): ChatMessage[] {
  const conversation = getDemoConversations(language).find((item) => item.id === conversationId);
  if (!conversation) return [];
  const baseTime = new Date(conversation.createdAt).getTime();
  return [
    {
      id: `${conversationId}-message-1`,
      conversationId,
      senderId: DEMO_CURRENT_USER_ID,
      body:
        language === "tr"
          ? "Merhaba, bu iş için kısa bir proje fikrim var. Uygunluğunu konuşabilir miyiz?"
          : "Hi, I have a short project idea for this. Can we discuss availability?",
      messageType: "text",
      isRead: true,
      createdAt: new Date(baseTime + 3_600_000).toISOString()
    },
    {
      id: `${conversationId}-message-2`,
      conversationId,
      senderId: conversation.artistId,
      body:
        conversation.lastMessage ??
        (language === "tr" ? "Elbette, brief'i paylaşabilirsin." : "Absolutely, send the brief over."),
      messageType: "text",
      isRead: false,
      createdAt: conversation.lastMessageAt
    }
  ];
}

export function createDemoMessage(
  conversationId: string,
  senderId: string,
  body: string
): ChatMessage {
  return {
    id: `demo-message-${Date.now()}`,
    conversationId,
    senderId,
    body: body.trim(),
    messageType: "text",
    isRead: true,
    createdAt: new Date().toISOString()
  };
}

export function getDemoConversationId(artistId: string, listingId?: string | null) {
  return listingId ? `demo-${listingId}` : `demo-artist-${artistId}`;
}

export function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    messageType: row.message_type,
    isRead: row.is_read,
    createdAt: row.created_at
  };
}

async function findMarketplaceConversation(
  client: JamlySupabaseClient,
  buyerId: string,
  artistId: string,
  listingId: string | null
) {
  let query = client
    .from("conversations")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("artist_id", artistId)
    .is("order_request_id", null);
  query = listingId ? query.eq("listing_id", listingId) : query.is("listing_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchProfiles(client: JamlySupabaseClient, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];
  const { data, error } = await client.from("profiles").select("*").in("id", uniqueIds);
  if (error) throw new Error(error.message);
  return data;
}

async function fetchListings(client: JamlySupabaseClient, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];
  const { data, error } = await client.from("listings").select("*").in("id", uniqueIds);
  if (error) throw new Error(error.message);
  return data;
}

async function fetchUnreadMessages(
  client: JamlySupabaseClient,
  conversationIds: string[],
  currentUserId: string
) {
  if (conversationIds.length === 0) return [];
  const { data, error } = await client
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .eq("is_read", false)
    .neq("sender_id", currentUserId);
  if (error) throw new Error(error.message);
  return data;
}

function mapConversation(
  row: ConversationRow,
  currentUserId: string,
  profiles: Map<string, ProfileRow>,
  listingsById: Map<string, ListingRow>,
  unreadCount: number
): ConversationSummary {
  const otherUserId = row.buyer_id === currentUserId ? row.artist_id : row.buyer_id;
  const profile = profiles.get(otherUserId);
  const listing = row.listing_id ? listingsById.get(row.listing_id) : undefined;

  return {
    id: row.id,
    buyerId: row.buyer_id,
    artistId: row.artist_id,
    listingId: row.listing_id,
    orderRequestId: row.order_request_id,
    otherUser: mapParticipant(otherUserId, profile),
    listing: listing ? mapConversationListing(listing) : null,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    unreadCount,
    isDemo: false
  };
}

function mapParticipant(id: string, profile?: ProfileRow): ConversationParticipant {
  return {
    id,
    name: profile?.full_name ?? "Jamly user",
    handle: profile?.handle ?? id,
    avatarUrl: profile?.avatar_url ?? DEFAULT_AVATAR,
    role: profile?.role ?? "buyer"
  };
}

function mapConversationListing(row: ListingRow): ConversationListing {
  return {
    id: row.id,
    title: row.title,
    coverImageUrl: row.cover_image_url,
    creatorId: row.creator_id
  };
}
