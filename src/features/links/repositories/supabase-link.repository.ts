import type { ILinkRepository } from "./link.repository.interface";
import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeUrl } from "@/lib/canonicalize";
import { AppError, ErrorCode } from "@/lib/errors";
import { withRetry, supabaseRetryPredicate } from "@/lib/retry";

/**
 * Supabase implementation of the Link Repository
 * Following Single Responsibility Principle - handles only data access
 */
export class SupabaseLinkRepository implements ILinkRepository {
    /**
     * Find all links for a user with optional filters and pagination
     */
    async findAll(userId: string, filters?: LinkFilters, limit?: number, offset?: number, searchQuery?: string): Promise<{ links: Link[], total: number }> {
        const supabase = await createClient();

        let query = supabase
            .from("links")
            .select("*", { count: 'exact' });

        query = query.eq("user_id", userId);

        if (filters?.is_archived !== undefined) {
            query = query.eq("is_archived", filters.is_archived);
        }

        if (filters?.is_deleted !== undefined) {
            query = query.eq("is_deleted", filters.is_deleted);
        }

        if (filters?.is_pinned !== undefined) {
            query = query.eq("is_pinned", filters.is_pinned);
        }

        if (filters?.content_type) {
            query = query.eq("content_type", filters.content_type);
        }

        // Apply search filter - search across title, url, domain, description, color_value
        if (searchQuery && searchQuery.trim()) {
            const searchTerm = `%${searchQuery.trim()}%`;
            query = query.or(`title.ilike.${searchTerm},url.ilike.${searchTerm},domain.ilike.${searchTerm},description.ilike.${searchTerm},color_value.ilike.${searchTerm}`);
        }

        // Apply sorting
        query = query.order("is_pinned", { ascending: false });
        query = query.order("created_at", { ascending: false });

        // Apply pagination
        if (limit !== undefined && offset !== undefined) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;

        if (error) {
            // Log error but return empty results rather than throwing
            console.error("Error fetching links:", error);
            return { links: [], total: 0 };
        }

        return { links: data || [], total: count || 0 };
    }

    /**
     * Find a single link by ID
     */
    async findById(id: string, userId: string): Promise<Link | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("links")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                // Not found
                return null;
            }
            throw new AppError(
                ErrorCode.QUERY_FAILED,
                `Failed to fetch link: ${error.message}`,
                500,
                { originalError: error }
            );
        }

        return data;
    }

    /**
     * Create a new link
     */
    async create(userId: string, data: CreateLinkDTO): Promise<Link> {
        const supabase = await createClient();

        // Extract domain from URL
        let domain = "";
        const contentType = data.content_type || "url";

        if (contentType === "color") {
            domain = "color";
        } else {
            try {
                domain = new URL(data.url).hostname.replace("www.", "");
            } catch {
                domain = data.url;
            }
        }

        const { data: link, error } = await supabase
            .from("links")
            .insert({
                user_id: userId,
                url: data.url,
                clean_url: contentType === "color" ? data.url : canonicalizeUrl(data.url),
                title: data.title,
                domain,
                content_type: contentType,
                color_value: data.color_value || null,
                favicon_url: data.favicon_url || null,
                og_image_url: data.og_image_url || null,
                description: data.description || null,
                is_pinned: false,
                is_archived: false,
                is_deleted: false,
            })
            .select()
            .single();
        
        if (error) {
            console.error('[SUPABASE CREATE] ERROR:', error);
            if (error.code === "23505") {
                // Unique constraint violation
                throw new AppError(
                    ErrorCode.ALREADY_EXISTS,
                    "A link with this URL already exists",
                    409,
                    { originalError: error }
                );
            }
            throw new AppError(
                ErrorCode.DATABASE_ERROR,
                `Failed to create link: ${error.message}`,
                500,
                { originalError: error }
            );
        }
        
        return link;
    }

    /**
     * Update an existing link
     * Uses retry logic for transient failures
     * Throws NOT_FOUND if link doesn't exist or RLS blocks access
     */
    async update(id: string, userId: string, data: UpdateLinkDTO): Promise<Link> {
        return withRetry(
            async () => {
                const supabase = await createClient();

                const { data: links, error } = await supabase
                    .from("links")
                    .update(data)
                    .eq("id", id)
                    .eq("user_id", userId)
                    .select();
                
                if (error) {
                    console.error('[SUPABASE UPDATE] ERROR:', error);
                    throw new AppError(
                        ErrorCode.DATABASE_ERROR,
                        `Failed to update link: ${error.message}`,
                        500,
                        { originalError: error }
                    );
                }

                // Critical fix: Check if any rows were actually affected
                if (!links || links.length === 0) {
                    throw new AppError(
                        ErrorCode.NOT_FOUND,
                        "Link not found or access denied",
                        404
                    );
                }
                
                return links[0];
            },
            {
                operationName: `update(${id})`,
                shouldRetry: supabaseRetryPredicate,
            }
        );
    }

    /**
     * Delete a link (Soft Delete)
     * Uses retry logic for transient failures
     * Throws NOT_FOUND if link doesn't exist or RLS blocks access
     */
    async delete(id: string, userId: string): Promise<void> {
        return withRetry(
            async () => {
                const supabase = await createClient();

                const { data, error } = await supabase
                    .from("links")
                    .update({
                        is_deleted: true,
                        is_archived: false,
                        deleted_at: new Date().toISOString()
                    })
                    .eq("id", id)
                    .eq("user_id", userId)
                    .select();
                
                if (error) {
                    console.error('[SUPABASE DELETE] ERROR:', error);
                    throw new AppError(
                        ErrorCode.DATABASE_ERROR,
                        `Failed to delete link: ${error.message}`,
                        500,
                        { originalError: error }
                    );
                }

                // Critical fix: Check if any rows were actually affected
                if (!data || data.length === 0) {
                    throw new AppError(
                        ErrorCode.NOT_FOUND,
                        "Link not found or access denied",
                        404
                    );
                }
            },
            {
                operationName: `delete(${id})`,
                shouldRetry: supabaseRetryPredicate,
            }
        );
    }

    /**
     * Check if a link exists for a user (for duplicate detection)
     */
    async exists(userId: string, url: string): Promise<Link | null> {
        const supabase = await createClient();

        // Normalize URL for comparison
        let normalizedUrl = url;
        try {
            const urlObj = new URL(url);
            normalizedUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.replace(/\/$/, '')}`;
        } catch {
            // If URL parsing fails, use original
            normalizedUrl = url;
        }

        const { data: links } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", userId)
            .eq("is_archived", false)
            .eq("is_deleted", false);

        // Check if any existing link matches
        const existingLink = links?.find((link: Link) => {
            if (link.url === url) return true;

            // Also check normalized URLs
            try {
                const existingUrlObj = new URL(link.url);
                const existingNormalized = `${existingUrlObj.protocol}//${existingUrlObj.host}${existingUrlObj.pathname.replace(/\/$/, '')}`;
                return existingNormalized === normalizedUrl;
            } catch {
                return false;
            }
        });

        return existingLink || null;
    }

    /**
     * Find a link by URL, including trashed links
     * Returns the link and whether it's currently in trash
     */
    async findByUrl(userId: string, url: string): Promise<{ link: Link; isInTrash: boolean } | null> {
        const supabase = await createClient();

        // Normalize URL for comparison
        let normalizedUrl = url;
        try {
            const urlObj = new URL(url);
            normalizedUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.replace(/\/$/, '')}`;
        } catch {
            // If URL parsing fails, use original
            normalizedUrl = url;
        }

        // Fetch all links for the user (including trashed ones)
        const { data: links } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", userId);

        // Check if any existing link matches
        const existingLink = links?.find((link: Link) => {
            if (link.url === url) return true;

            // Also check normalized URLs
            try {
                const existingUrlObj = new URL(link.url);
                const existingNormalized = `${existingUrlObj.protocol}//${existingUrlObj.host}${existingUrlObj.pathname.replace(/\/$/, '')}`;
                return existingNormalized === normalizedUrl;
            } catch {
                return false;
            }
        });

        if (!existingLink) {
            return null;
        }

        return {
            link: existingLink,
            isInTrash: existingLink.is_deleted || existingLink.is_archived
        };
    }
}
