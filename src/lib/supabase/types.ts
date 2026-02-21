export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          preferences: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          preferences?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          preferences?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_billing: {
        Row: {
          user_id: string;
          plan_tier: "starter" | "pro" | "believer";
          subscription_status: "inactive" | "active" | "past_due" | "canceled" | "expired";
          billing_interval: "month" | "year" | null;
          lemon_customer_id: string | null;
          lemon_subscription_id: string | null;
          lemon_variant_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          support_amount_cents: number | null;
          last_webhook_event_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan_tier?: "starter" | "pro" | "believer";
          subscription_status?: "inactive" | "active" | "past_due" | "canceled" | "expired";
          billing_interval?: "month" | "year" | null;
          lemon_customer_id?: string | null;
          lemon_subscription_id?: string | null;
          lemon_variant_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          support_amount_cents?: number | null;
          last_webhook_event_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          plan_tier?: "starter" | "pro" | "believer";
          subscription_status?: "inactive" | "active" | "past_due" | "canceled" | "expired";
          billing_interval?: "month" | "year" | null;
          lemon_customer_id?: string | null;
          lemon_subscription_id?: string | null;
          lemon_variant_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          support_amount_cents?: number | null;
          last_webhook_event_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      billing_webhook_events: {
        Row: {
          id: number;
          event_id: string;
          event_name: string;
          payload: Record<string, unknown>;
          processed_at: string;
        };
        Insert: {
          id?: number;
          event_id: string;
          event_name: string;
          payload: Record<string, unknown>;
          processed_at?: string;
        };
        Update: {
          id?: number;
          event_id?: string;
          event_name?: string;
          payload?: Record<string, unknown>;
          processed_at?: string;
        };
      };
      spaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          sort_order: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          sort_order?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      link_spaces: {
        Row: {
          id: string;
          link_id: string;
          space_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          space_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          space_id?: string;
          created_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          url: string;
          clean_url: string;
          domain: string;
          favicon_url: string | null;
          og_image_url: string | null;
          description: string | null;
          content_text: string | null;
          content_type: string;
          color_value: string | null;
          rich_text_content: Record<string, unknown> | null;
          notes: string | null;
          ai_summary: string | null;
          ai_tags: string[] | null;
          ai_key_themes: Record<string, unknown> | null;
          ai_quotes: Record<string, unknown> | null;
          ai_facts: Record<string, unknown> | null;
          ai_people: string[] | null;
          is_archived: boolean;
          is_favorite: boolean;
          is_pinned: boolean;
          read_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
          // Comprehensive metadata columns
          final_url: string | null;
          canonical_url: string | null;
          site_name: string | null;
          favicon_variants: Record<string, unknown>[] | null;
          preview_image_width: number | null;
          preview_image_height: number | null;
          theme_color: string | null;
          language: string | null;
          word_count: number | null;
          reading_time_minutes: number | null;
          status_code: number | null;
          fetch_status: string;
          fetched_at: string | null;
          etag: string | null;
          last_modified: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          url: string;
          clean_url: string;
          domain: string;
          favicon_url?: string | null;
          og_image_url?: string | null;
          description?: string | null;
          content_text?: string | null;
          content_type?: string;
          color_value?: string | null;
          rich_text_content?: Record<string, unknown> | null;
          notes?: string | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          ai_key_themes?: Record<string, unknown> | null;
          ai_quotes?: Record<string, unknown> | null;
          ai_facts?: Record<string, unknown> | null;
          ai_people?: string[] | null;
          is_archived?: boolean;
          is_favorite?: boolean;
          is_pinned?: boolean;
          read_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          // Comprehensive metadata columns
          final_url?: string | null;
          canonical_url?: string | null;
          site_name?: string | null;
          favicon_variants?: Record<string, unknown>[] | null;
          preview_image_width?: number | null;
          preview_image_height?: number | null;
          theme_color?: string | null;
          language?: string | null;
          word_count?: number | null;
          reading_time_minutes?: number | null;
          status_code?: number | null;
          fetch_status?: string;
          fetched_at?: string | null;
          etag?: string | null;
          last_modified?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          url?: string;
          clean_url?: string;
          domain?: string;
          favicon_url?: string | null;
          og_image_url?: string | null;
          description?: string | null;
          content_text?: string | null;
          content_type?: string;
          color_value?: string | null;
          rich_text_content?: Record<string, unknown> | null;
          notes?: string | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          ai_key_themes?: Record<string, unknown> | null;
          ai_quotes?: Record<string, unknown> | null;
          ai_facts?: Record<string, unknown> | null;
          ai_people?: string[] | null;
          is_archived?: boolean;
          is_favorite?: boolean;
          is_pinned?: boolean;
          read_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          // Comprehensive metadata columns
          final_url?: string | null;
          canonical_url?: string | null;
          site_name?: string | null;
          favicon_variants?: Record<string, unknown>[] | null;
          preview_image_width?: number | null;
          preview_image_height?: number | null;
          theme_color?: string | null;
          language?: string | null;
          word_count?: number | null;
          reading_time_minutes?: number | null;
          status_code?: number | null;
          fetch_status?: string;
          fetched_at?: string | null;
          etag?: string | null;
          last_modified?: string | null;
        };
      };
      bookmark_import_jobs: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          storage_path: string;
          original_filename: string;
          file_size_bytes: number;
          folder_mode: string | null;
          single_space_id: string | null;
          folder_to_space_map: Record<string, string> | null;
          fallback_space_id: string | null;
          preview_total_links: number;
          preview_invalid_links: number;
          preview_top_folders: string[] | null;
          preview_sample_links: Record<string, unknown>[] | null;
          processed_links: number;
          created_links: number;
          restored_links: number;
          duplicate_links: number;
          invalid_links: number;
          space_attached_existing_links: number;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status: string;
          storage_path: string;
          original_filename: string;
          file_size_bytes: number;
          folder_mode?: string | null;
          single_space_id?: string | null;
          folder_to_space_map?: Record<string, string> | null;
          fallback_space_id?: string | null;
          preview_total_links?: number;
          preview_invalid_links?: number;
          preview_top_folders?: string[] | null;
          preview_sample_links?: Record<string, unknown>[] | null;
          processed_links?: number;
          created_links?: number;
          restored_links?: number;
          duplicate_links?: number;
          invalid_links?: number;
          space_attached_existing_links?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          storage_path?: string;
          original_filename?: string;
          file_size_bytes?: number;
          folder_mode?: string | null;
          single_space_id?: string | null;
          folder_to_space_map?: Record<string, string> | null;
          fallback_space_id?: string | null;
          preview_total_links?: number;
          preview_invalid_links?: number;
          preview_top_folders?: string[] | null;
          preview_sample_links?: Record<string, unknown>[] | null;
          processed_links?: number;
          created_links?: number;
          restored_links?: number;
          duplicate_links?: number;
          invalid_links?: number;
          space_attached_existing_links?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      link_tags: {
        Row: {
          id: string;
          link_id: string;
          tag_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          tag_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          tag_name?: string;
          created_at?: string;
        };
      };
    };
  };
}
