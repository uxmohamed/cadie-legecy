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

