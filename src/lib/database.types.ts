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
      account_status: "active" | "suspended" | "banned";
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
          handle_updated_at: string | null;
          full_name: string;
          headline: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          location: string | null;
          bio: string | null;
          specialties: string[] | null;
          social_links: Json;
          account_status: Database["public"]["Enums"]["account_status"];
          created_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["profile_role"];
          handle: string;
          handle_updated_at?: string | null;
          full_name: string;
          headline?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          location?: string | null;
          bio?: string | null;
          specialties?: string[] | null;
          social_links?: Json;
          account_status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      admin_accounts: {
        Row: {
          user_id: string;
          created_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_accounts"]["Insert"]>;
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
      reports: {
        Row: {
          id: string;
          reported_by: string | null;
          target_type: "user" | "listing" | "review" | "message";
          target_id: string;
          reason: string;
          status: "pending" | "reviewing" | "resolved" | "dismissed";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reported_by?: string | null;
          target_type: "user" | "listing" | "review" | "message";
          target_id: string;
          reason: string;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      platform_skills: {
        Row: {
          id: string;
          slug: string;
          category_key: string;
          label: Json;
          synonyms: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          category_key: string;
          label: Json;
          synonyms?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_skills"]["Insert"]>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_set_profile_status: {
        Args: {
          p_profile_id: string;
          p_status: Database["public"]["Enums"]["account_status"];
        };
        Returns: undefined;
      };
      get_admin_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_users: number;
          active_users: number;
          suspended_users: number;
          banned_users: number;
          admin_users: number;
          artist_count: number;
          buyer_count: number;
          listing_count: number;
          active_listing_count: number;
          inactive_listing_count: number;
          order_count: number;
          open_order_count: number;
          reported_content_count: number;
        }[];
      };
      is_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
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
