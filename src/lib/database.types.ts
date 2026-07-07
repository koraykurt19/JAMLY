export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      profile_role: "creator" | "buyer";
      listing_category:
        | "Beat"
        | "Mixing"
        | "Mastering"
        | "Songwriting"
        | "Vocal Feature"
        | "Custom Production"
        | "Guitar"
        | "Lyrics"
        | "Jingle"
        | "Cover Art";
      license_type:
        | "Basic Lease"
        | "Premium Lease"
        | "Exclusive"
        | "Service";
      license_tier: "non_exclusive" | "unlimited" | "exclusive" | "service";
      order_status: "requested" | "in_review" | "delivered" | "cancelled";
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["profile_role"];
          handle: string;
          full_name: string;
          headline: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          location: string | null;
          bio: string | null;
          specialties: string[] | null;
          social_links: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["profile_role"];
          handle: string;
          full_name: string;
          headline?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          location?: string | null;
          bio?: string | null;
          specialties?: string[] | null;
          social_links?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          category: Database["public"]["Enums"]["listing_category"];
          genre: string;
          bpm: number | null;
          price: number;
          price_non_exclusive: number | null;
          price_unlimited: number | null;
          price_exclusive: number | null;
          description: string;
          audio_preview_url: string;
          cover_image_url: string;
          delivery_mp3_path: string | null;
          delivery_unlimited_path: string | null;
          delivery_exclusive_path: string | null;
          license_type: Database["public"]["Enums"]["license_type"];
          turnaround: string | null;
          tags: string[] | null;
          exclusive_sold: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          category: Database["public"]["Enums"]["listing_category"];
          genre: string;
          bpm?: number | null;
          price: number;
          price_non_exclusive?: number | null;
          price_unlimited?: number | null;
          price_exclusive?: number | null;
          description: string;
          audio_preview_url: string;
          cover_image_url: string;
          delivery_mp3_path?: string | null;
          delivery_unlimited_path?: string | null;
          delivery_exclusive_path?: string | null;
          license_type: Database["public"]["Enums"]["license_type"];
          turnaround?: string | null;
          tags?: string[] | null;
          exclusive_sold?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
        Relationships: [];
      };
      order_requests: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          creator_id: string;
          message: string | null;
          budget: number | null;
          license_tier: Database["public"]["Enums"]["license_tier"];
          license_price: number | null;
          license_terms_version: string | null;
          status: Database["public"]["Enums"]["order_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          creator_id: string;
          message?: string | null;
          budget?: number | null;
          license_tier?: Database["public"]["Enums"]["license_tier"];
          license_price?: number | null;
          license_terms_version?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_requests"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          buyer_id: string;
          artist_id: string;
          listing_id: string | null;
          order_request_id: string | null;
          last_message: string | null;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          artist_id: string;
          listing_id?: string | null;
          order_request_id?: string | null;
          last_message?: string | null;
          last_message_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          message_type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          message_type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      message_attachments: {
        Row: {
          id: string;
          message_id: string;
          file_url: string;
          file_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          file_url: string;
          file_type?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_attachments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      purchase_listing_license: {
        Args: {
          p_listing_id: string;
          p_license_tier: Database["public"]["Enums"]["license_tier"];
          p_message?: string | null;
        };
        Returns: string;
      };
    };
    CompositeTypes: Record<string, never>;
  };
};
