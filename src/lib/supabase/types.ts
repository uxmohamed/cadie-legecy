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
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
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
          category_id: string | null;
          favicon_url: string | null;
          og_image_url: string | null;
          description: string | null;
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
          category_id?: string | null;
          favicon_url?: string | null;
          og_image_url?: string | null;
          description?: string | null;
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
          category_id?: string | null;
          favicon_url?: string | null;
          og_image_url?: string | null;
          description?: string | null;
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

