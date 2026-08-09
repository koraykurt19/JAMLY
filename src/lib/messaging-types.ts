export type ConversationParticipant = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  role: "buyer" | "creator";
};

export type ConversationListing = {
  id: string;
  title: string;
  coverImageUrl: string;
  creatorId: string;
};

export type ConversationSummary = {
  id: string;
  buyerId: string;
  artistId: string;
  listingId: string | null;
  orderRequestId: string | null;
  otherUser: ConversationParticipant;
  listing: ConversationListing | null;
  lastMessage: string | null;
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  isDemo: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
};
