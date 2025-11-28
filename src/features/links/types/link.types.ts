

/**
 * Content types supported by the application
 */
export type ContentType = "url" | "color";

/**
 * Link entity representing a saved item
 */
export interface Link {
    id: string;
    user_id: string;
    url: string;
    clean_url: string;
    title: string;
    domain: string;
    content_type: ContentType;
    category_id: string | null;
    color_value: string | null;
    favicon_url: string | null;
    og_image_url: string | null;
    description: string | null;
    ai_summary: string | null;
    ai_tags: string[] | null;
    ai_key_themes: Record<string, unknown> | null;
    ai_quotes: Record<string, unknown> | null;
    ai_facts: Record<string, unknown> | null;
    ai_people: string[] | null;
    is_pinned: boolean;
    is_archived: boolean;
    is_deleted: boolean;
    is_favorite: boolean;
    read_at: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

/**
 * DTO for creating a new link
 */
export interface CreateLinkDTO {
    url: string;
    title: string;
    content_type?: ContentType;
    category_id?: string | null;
    color_value?: string | null;
    favicon_url?: string | null;
    og_image_url: string | null;
    description?: string | null;
}

/**
 * DTO for updating an existing link
 */
export interface UpdateLinkDTO {
    url?: string;
    title?: string;
    content_type?: ContentType;
    category_id?: string | null;
    color_value?: string | null;
    favicon_url?: string | null;
    og_image_url?: string | null;
    description?: string | null;
    is_pinned?: boolean;
    is_archived?: boolean;
    is_deleted?: boolean;
}

/**
 * Filters for querying links
 */
export interface LinkFilters {
    category_id?: string;
    is_archived?: boolean;
    is_deleted?: boolean;
    is_pinned?: boolean;
    content_type?: ContentType;
}

/**
 * Metadata extracted from a URL
 */
export interface LinkMetadata {
    title?: string;
    description?: string;
    favicon?: string;
    ogImage?: string;
    domain?: string;
}
