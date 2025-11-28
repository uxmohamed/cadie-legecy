
export interface LinkMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
}

export interface Link {
  id: string;
  user_id: string;
  title: string;
  url: string;
  clean_url: string;
  domain: string;
  category_id?: string | null;
  favicon_url?: string | null;
  og_image_url?: string | null;
  description?: string | null;
  content_type: string;
  color_value?: string | null;
  ai_summary?: string | null;
  ai_tags?: string[] | null;
  ai_key_themes?: Record<string, unknown> | null;
  ai_quotes?: Record<string, unknown> | null;
  ai_facts?: Record<string, unknown> | null;
  ai_people?: string[] | null;
  is_archived: boolean;
  is_favorite: boolean;
  is_pinned: boolean;
  read_at?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string | null;
  description?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  count?: number;
}

