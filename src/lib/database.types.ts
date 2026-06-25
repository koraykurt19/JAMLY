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
          description: string;
          audio_preview_url: string;
          cover_image_url: string;
          license_type: Database["public"]["Enums"]["license_type"];
          turnaround: string | null;
          tags: string[] | null;
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
          description: string;
          audio_preview_url: string;
          cover_image_url: string;
          license_type: Database["public"]["Enums"]["license_type"];
          turnaround?: string | null;
          tags?: string[] | null;
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
          status?: Database["public"]["Enums"]["order_status"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_requests"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          order_request_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          order_request_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
