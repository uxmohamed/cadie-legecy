

/**
 * Content types supported by the application
 */
export type ContentType = "url" | "color" | "image" | "document" | "note";

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
    content_text: string | null;
    color_value: string | null;
    favicon_url: string | null;
    og_image_url: string | null;
    description: string | null;
    notes?: string | null;
    ai_summary: string | null;
    ai_tags: string[] | null;
    ai_key_themes: Record<string, unknown> | null;
    ai_quotes: Record<string, unknown> | null;
    ai_facts: Record<string, unknown> | null;
    ai_people: string[] | null;
    is_pinned: boolean;
    is_archived: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
    is_favorite: boolean;
    read_at: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Comprehensive metadata columns
    final_url: string | null;
    canonical_url: string | null;
    site_name: string | null;
    favicon_variants: FaviconVariant[] | null;
    preview_image_width: number | null;
    preview_image_height: number | null;
    theme_color: string | null;
    language: string | null;
    word_count: number | null;
    reading_time_minutes: number | null;
    status_code: number | null;
    fetch_status: FetchStatus;
    fetched_at: string | null;
    etag: string | null;
    last_modified: string | null;
}

/**
 * DTO for creating a new link
 * Only URL is required - server extracts title from domain if not provided
 */
export interface CreateLinkDTO {
    url: string;
    title?: string;  // Optional - server uses domain as placeholder if not provided
    content_type?: ContentType;
    color_value?: string | null;
    favicon_url?: string | null;
    og_image_url?: string | null;
    description?: string | null;
    notes?: string | null;
    content_text?: string | null;
}

/**
 * DTO for updating an existing link
 */
export interface UpdateLinkDTO {
    url?: string;
    title?: string;
    content_type?: ContentType;
    color_value?: string | null;
    favicon_url?: string | null;
    og_image_url?: string | null;
    description?: string | null;
    notes?: string | null;
    content_text?: string | null;
    ai_tags?: string[] | null;
    ai_key_themes?: Record<string, unknown> | null;
    is_pinned?: boolean;
    is_archived?: boolean;
    is_deleted?: boolean;
    deleted_at?: string | null;
    // Extended metadata fields
    site_name?: string | null;
    final_url?: string | null;
    canonical_url?: string | null;
    theme_color?: string | null;
    language?: string | null;
    word_count?: number | null;
    reading_time_minutes?: number | null;
    status_code?: number | null;
    fetch_status?: FetchStatus;
    fetched_at?: string | null;
}

/**
 * Filters for querying links
 */
export interface LinkFilters {
    space_id?: string;
    is_archived?: boolean;
    is_deleted?: boolean;
    is_pinned?: boolean;
    content_type?: ContentType;
}

/**
 * Metadata extracted from a URL (legacy, kept for compatibility)
 */
export interface LinkMetadata {
    title?: string;
    description?: string;
    favicon?: string;
    ogImage?: string;
    domain?: string;
}

// =============================================================================
// Production-Grade Metadata Types
// =============================================================================

/**
 * Fetch status for tracking metadata retrieval state
 */
export type FetchStatus =
    | "pending"       // Not yet fetched
    | "fetching"      // Currently being fetched
    | "success"       // Successfully fetched
    | "timeout"       // Fetch timed out
    | "blocked"       // Site blocked our request
    | "invalid_ssl"   // SSL certificate error
    | "invalid_html"  // Could not parse HTML
    | "failed";       // Generic failure

/**
 * Favicon variant with metadata for smart selection
 */
export interface FaviconVariant {
    url: string;
    sizes?: string;      // e.g., "16x16", "32x32 48x48"
    type?: string;       // e.g., "image/png", "image/svg+xml"
    rel?: string;        // e.g., "icon", "apple-touch-icon"
}

/**
 * Comprehensive metadata extracted from an HTML page
 */
export interface ExtractedMetadata {
    // URL-level data
    final_url?: string;              // After redirects
    canonical_url?: string;          // From <link rel="canonical">
    domain: string;                  // Hostname without www
    protocol?: string;               // http, https, etc.

    // Identity/labeling
    title: string;
    site_name?: string;
    description?: string;

    // Visual identity
    favicon_url?: string;            // Best selected favicon
    favicon_variants?: FaviconVariant[];
    preview_image_url?: string;      // OG image or best guess
    preview_image_width?: number;
    preview_image_height?: number;
    theme_color?: string;            // Brand/accent color

    // Content signals
    language?: string;
    word_count?: number;
    reading_time_minutes?: number;
    content_text?: string;

    // System info
    status_code?: number;
    fetch_status: FetchStatus;
    fetched_at?: string;
    etag?: string;
    last_modified?: string;
}

/**
 * Options for batch metadata fetching
 */
export interface BatchMetadataOptions {
    timeout?: number;          // Per-URL timeout in ms (default: 5000)
    concurrency?: number;      // Max parallel requests (default: 5)
    skipCache?: boolean;       // Force fresh fetch
}

/**
 * Result of batch metadata enrichment
 */
export interface BatchEnrichmentResult {
    successful: number;
    failed: number;
    results: Map<string, ExtractedMetadata | { error: string; fetch_status: FetchStatus }>;
}
