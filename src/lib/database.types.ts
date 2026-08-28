export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Shape returned by the `get_admin_overview_v2` RPC. */
export type AdminOverviewV2 = {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    creators: number;
    buyers: number;
    new_7d: number;
    new_30d: number;
  };
  waitlist: {
    total: number;
    verified: number;
    invited: number;
    converted: number;
    flagged: number;
    new_7d: number;
  } | null;
  listings: { total: number; active: number; inactive: number; exclusive_sold: number };
  orders: {
    total: number;
    open: number;
    delivered: number;
    cancelled: number;
    awaiting_payment: number;
  };
  finance: { gmv: number; gmv_30d: number; refunded: number; disputed: number };
  moderation: {
    reports_open: number;
    reports_urgent: number;
    tickets_open: number;
    badges_awarded: number;
  };
  admins: { total: number; super_admins: number };
  generated_at: string;
};

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
      payment_state:
        | "unpaid"
        | "processing"
        | "requires_action"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "disputed"
        | "chargeback";
      admin_role:
        | "super_admin"
        | "admin"
        | "moderator"
        | "support"
        | "finance"
        | "content_reviewer"
        | "analyst";
      waitlist_status:
        | "pending"
        | "verified"
        | "invited"
        | "converted"
        | "suppressed"
        | "blocked";
      waitlist_persona: "creator" | "buyer" | "both";
      badge_category:
        | "early_access"
        | "verification"
        | "marketplace"
        | "collaboration"
        | "community";
      badge_rarity: "common" | "uncommon" | "rare" | "legendary";
      badge_award_source: "automatic" | "manual" | "import";
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
      profile_follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_follows"]["Insert"]>;
        Relationships: [];
      };
      profile_retention_settings: {
        Row: {
          profile_id: string;
          plan: "standard" | "premium";
          retention_multiplier: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          plan?: "standard" | "premium";
          retention_multiplier?: number;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_retention_settings"]["Insert"]>;
        Relationships: [];
      };
      retention_policy_runs: {
        Row: {
          id: string;
          mode: "dry_run" | "execute";
          status: "completed" | "failed";
          summary: Json;
          executed_by: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mode: "dry_run" | "execute";
          status: "completed" | "failed";
          summary?: Json;
          executed_by?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["retention_policy_runs"]["Insert"]>;
        Relationships: [];
      };
      collab_projects: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          owner_id: string;
          listing_id: string | null;
          status: "draft" | "active" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          owner_id: string;
          listing_id?: string | null;
          status?: "draft" | "active" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collab_projects"]["Insert"]>;
        Relationships: [];
      };
      collab_participants: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: "producer" | "composer" | "mixing" | "mastering" | "other";
          revenue_share: number;
          invite_status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: "producer" | "composer" | "mixing" | "mastering" | "other";
          revenue_share?: number;
          invite_status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collab_participants"]["Insert"]>;
        Relationships: [];
      };
      collab_versions: {
        Row: {
          id: string;
          project_id: string;
          uploaded_by: string;
          file_path: string;
          version_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          uploaded_by: string;
          file_path: string;
          version_note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collab_versions"]["Insert"]>;
        Relationships: [];
      };
      collab_comments: {
        Row: {
          id: string;
          project_id: string;
          version_id: string;
          user_id: string;
          content: string;
          timestamp_seconds: number | null;
          parent_comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version_id: string;
          user_id: string;
          content: string;
          timestamp_seconds?: number | null;
          parent_comment_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collab_comments"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "collab_invite" | "new_version" | "new_comment";
          payload: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "collab_invite" | "new_version" | "new_comment";
          payload?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      revenue_splits: {
        Row: {
          id: string;
          order_request_id: string;
          project_id: string;
          recipient_id: string;
          percentage: number;
          gross_amount: number;
          split_amount: number;
          currency: "USD" | "TRY";
          created_at: string;
        };
        Insert: {
          id?: string;
          order_request_id: string;
          project_id: string;
          recipient_id: string;
          percentage: number;
          gross_amount: number;
          split_amount: number;
          currency?: "USD" | "TRY";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["revenue_splits"]["Insert"]>;
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
          license_snapshot: Json | null;
          delivery_path_snapshot: string | null;
          listing_title_snapshot: string | null;
          status: Database["public"]["Enums"]["order_status"];
          payment_status: Database["public"]["Enums"]["payment_state"];
          currency: string;
          provider_reference: string | null;
          paid_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
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
          license_snapshot?: Json | null;
          delivery_path_snapshot?: string | null;
          listing_title_snapshot?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_state"];
          currency?: string;
          provider_reference?: string | null;
          paid_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          target_type: "user" | "profile" | "listing" | "review" | "message" | "order";
          target_id: string;
          reason: string;
          category: string;
          status: "pending" | "reviewing" | "resolved" | "dismissed";
          priority: "low" | "normal" | "high" | "urgent";
          assigned_to: string | null;
          internal_notes: string | null;
          resolution: string | null;
          resolution_action: string | null;
          evidence_urls: string[];
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reported_by?: string | null;
          target_type: "user" | "profile" | "listing" | "review" | "message" | "order";
          target_id: string;
          reason: string;
          category?: string;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          priority?: "low" | "normal" | "high" | "urgent";
          assigned_to?: string | null;
          internal_notes?: string | null;
          resolution?: string | null;
          resolution_action?: string | null;
          evidence_urls?: string[];
          created_at?: string;
          updated_at?: string;
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
      waitlist_entries: {
        Row: {
          id: string;
          email: string;
          email_domain: string | null;
          display_name: string | null;
          reserved_username: string | null;
          persona: Database["public"]["Enums"]["waitlist_persona"];
          interests: string[];
          locale: string;
          referral_code: string;
          referred_by: string | null;
          referral_count: number;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          accepted_terms: boolean;
          marketing_opt_in: boolean;
          consent_recorded_at: string | null;
          status: Database["public"]["Enums"]["waitlist_status"];
          verification_token_hash: string | null;
          verification_sent_at: string | null;
          verified_at: string | null;
          queue_position: number;
          risk_flags: string[];
          signup_ip_hash: string | null;
          invited_at: string | null;
          converted_at: string | null;
          converted_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["waitlist_entries"]["Row"]> & {
          email: string;
          referral_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["waitlist_entries"]["Row"]>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          actor_role: Database["public"]["Enums"]["admin_role"] | null;
          action: string;
          target_type: string;
          target_id: string | null;
          before_summary: Json | null;
          after_summary: Json | null;
          reason: string | null;
          result: string;
          correlation_id: string | null;
          ip_prefix: string | null;
          user_agent_family: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      badge_definitions: {
        Row: {
          key: string;
          name_tr: string;
          name_en: string;
          description_tr: string;
          description_en: string;
          category: Database["public"]["Enums"]["badge_category"];
          rarity: Database["public"]["Enums"]["badge_rarity"];
          icon: string;
          tone: string;
          award_source: Database["public"]["Enums"]["badge_award_source"];
          eligibility: Json;
          revocable: boolean;
          permanent: boolean;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["badge_definitions"]["Row"]> & { key: string };
        Update: Partial<Database["public"]["Tables"]["badge_definitions"]["Row"]>;
        Relationships: [];
      };
      badge_awards: {
        Row: {
          id: string;
          profile_id: string;
          badge_key: string;
          source: Database["public"]["Enums"]["badge_award_source"];
          eligibility_source: Json;
          award_reason: string | null;
          awarded_by: string | null;
          awarded_at: string;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          is_visible: boolean;
          display_order: number | null;
          expires_at: string | null;
          metadata: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["badge_awards"]["Row"]> & {
          profile_id: string;
          badge_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["badge_awards"]["Row"]>;
        Relationships: [];
      };
      payment_webhook_events: {
        Row: {
          id: string;
          provider: string;
          provider_event_id: string;
          event_type: string;
          payload: Json;
          processed_at: string | null;
          process_error: string | null;
          received_at: string;
        };
        Insert: {
          provider: string;
          provider_event_id: string;
          event_type: string;
          payload?: Json;
          processed_at?: string | null;
          process_error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payment_webhook_events"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          provider_payment_id: string | null;
          status: Database["public"]["Enums"]["payment_state"];
          amount_minor: number;
          currency: string;
          platform_fee_minor: number;
          processor_fee_minor: number;
          net_minor: number;
          idempotency_key: string | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          order_id: string;
          amount_minor: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          requester_id: string;
          category: string;
          subject: string;
          body: string;
          order_id: string | null;
          status: string;
          priority: string;
          assigned_to: string | null;
          internal_notes: string | null;
          resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & {
          requester_id: string;
          category: string;
          subject: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
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
      get_my_collab_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          participant_id: string;
          project_id: string;
          project_title: string;
          project_description: string | null;
          owner_id: string;
          owner_handle: string | null;
          participant_role: string;
          revenue_share: number;
          created_at: string;
        }[];
      };
      is_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      is_collab_project_member: {
        Args: { p_project_id: string; p_user_id?: string };
        Returns: boolean;
      };
      purchase_listing_license: {
        Args: {
          p_listing_id: string;
          p_license_tier: Database["public"]["Enums"]["license_tier"];
          p_license_snapshot?: Record<string, unknown> | null;
        };
        Returns: string;
      };
      set_order_status: {
        Args: {
          p_order_id: string;
          p_next_status: Database["public"]["Enums"]["order_status"];
          p_expected_status?: Database["public"]["Enums"]["order_status"] | null;
        };
        Returns: Database["public"]["Enums"]["order_status"];
      };
      is_current_user_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_has: {
        Args: { p_capability: string };
        Returns: boolean;
      };
      current_admin_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["admin_role"] | null;
      };
      admin_set_listing_state: {
        Args: { p_listing_id: string; p_is_active: boolean; p_reason: string };
        Returns: undefined;
      };
      admin_set_admin_role: {
        Args: {
          p_profile_id: string;
          p_role: Database["public"]["Enums"]["admin_role"];
          p_is_active?: boolean;
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      admin_set_waitlist_status: {
        Args: {
          p_entry_id: string;
          p_status: Database["public"]["Enums"]["waitlist_status"];
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      admin_release_exclusive: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      record_admin_action: {
        Args: {
          p_action: string;
          p_target_type: string;
          p_target_id?: string | null;
          p_before?: Record<string, unknown> | null;
          p_after?: Record<string, unknown> | null;
          p_reason?: string | null;
          p_result?: string;
          p_correlation_id?: string | null;
        };
        Returns: number;
      };
      resolve_report: {
        Args: {
          p_report_id: string;
          p_status: string;
          p_resolution?: string | null;
          p_resolution_action?: string | null;
        };
        Returns: undefined;
      };
      get_admin_overview_v2: {
        Args: Record<PropertyKey, never>;
        Returns: AdminOverviewV2;
      };
      admin_retention_plan: {
        Args: { p_execute?: boolean };
        Returns: Json;
      };
      retention_multiplier_for_profile: {
        Args: { p_profile_id: string };
        Returns: number;
      };
      consume_rate_limit: {
        Args: {
          p_bucket: string;
          p_identity: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          retry_after_seconds: number;
        }[];
      };
      get_waitlist_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_count: number;
          verified_count: number;
          creator_count: number;
          latest_signup_at: string | null;
        }[];
      };
      join_waitlist: {
        Args: {
          p_email: string;
          p_display_name?: string | null;
          p_reserved_username?: string | null;
          p_persona?: Database["public"]["Enums"]["waitlist_persona"];
          p_interests?: string[];
          p_locale?: string;
          p_referral_code?: string | null;
          p_utm?: Record<string, unknown>;
          p_accepted_terms?: boolean;
          p_marketing_opt_in?: boolean;
          p_verification_token_hash?: string | null;
          p_ip_hash?: string | null;
        };
        Returns: {
          entry_id: string;
          queue_position: number;
          referral_code: string;
          status: Database["public"]["Enums"]["waitlist_status"];
          already_registered: boolean;
        }[];
      };
      verify_waitlist_entry: {
        Args: { p_token_hash: string };
        Returns: {
          entry_id: string;
          queue_position: number;
          referral_code: string;
          verified: boolean;
        }[];
      };
      get_profile_badges: {
        Args: { p_profile_id: string };
        Returns: {
          badge_key: string;
          name_tr: string;
          name_en: string;
          description_tr: string;
          description_en: string;
          category: Database["public"]["Enums"]["badge_category"];
          rarity: Database["public"]["Enums"]["badge_rarity"];
          icon: string;
          tone: string;
          awarded_at: string;
          display_order: number;
        }[];
      };
      grant_badge: {
        Args: {
          p_profile_id: string;
          p_badge_key: string;
          p_reason?: string | null;
          p_source?: string;
          p_eligibility_source?: Record<string, unknown>;
        };
        Returns: string;
      };
      revoke_badge: {
        Args: { p_profile_id: string; p_badge_key: string; p_reason: string };
        Returns: undefined;
      };
      evaluate_profile_badges: {
        Args: { p_profile_id: string };
        Returns: number;
      };
      settle_order_payment: {
        Args: {
          p_order_id: string;
          p_payment_status: Database["public"]["Enums"]["payment_state"];
          p_provider_reference?: string | null;
        };
        Returns: undefined;
      };
      record_payment_settlement: {
        Args: {
          p_order_id: string;
          p_provider: string;
          p_provider_payment_id: string;
          p_amount_minor: number;
          p_currency?: string;
          p_processor_fee_minor?: number;
        };
        Returns: string;
      };
      record_payment_refund: {
        Args: { p_payment_id: string; p_amount_minor: number; p_reason?: string | null };
        Returns: undefined;
      };
      get_account_balance: {
        Args: { p_profile_id?: string };
        Returns: {
          currency: string;
          balance_minor: number;
          pending_payout_minor: number;
        }[];
      };
      enqueue_email: {
        Args: {
          p_template: string;
          p_to_email: string;
          p_subject: string;
          p_payload?: Record<string, unknown>;
          p_locale?: string;
          p_kind?: string;
        };
        Returns: string;
      };
    };
    CompositeTypes: Record<string, never>;
  };
};
