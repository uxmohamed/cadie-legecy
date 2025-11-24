import type { ILinkRepository } from "./link.repository.interface";
import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";
import { createClient } from "@/lib/supabase/server";
import { createInitialRichTextState } from "@/lib/rich-text-utils";

/**
 * Supabase implementation of the Link Repository
 * Following Single Responsibility Principle - handles only data access
 */
export class SupabaseLinkRepository implements ILinkRepository {
    /**
     * Find all links for a user with optional filters
     */
    async findAll(userId: string, filters?: LinkFilters): Promise<Link[]> {
        const supabase = await createClient();

        let query = supabase
            .from("links")
            .select("*")
            .eq("user_id", userId)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (filters?.category_id) {
            query = query.eq("category_id", filters.category_id);
        }

        if (filters?.is_archived !== undefined) {
            query = query.eq("is_archived", filters.is_archived);
        }

        if (filters?.is_pinned !== undefined) {
            query = query.eq("is_pinned", filters.is_pinned);
        }

        if (filters?.content_type) {
            query = query.eq("content_type", filters.content_type);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch links: ${error.message}`);
        }

        return data || [];
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
            throw new Error(`Failed to fetch link: ${error.message}`);
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
        } else if (contentType === "text") {
            domain = "text";
        } else {
            try {
                domain = new URL(data.url).hostname.replace("www.", "");
            } catch {
                domain = data.url;
            }
        }

        // For text content type, create initial rich text state if not provided
        let richTextContent = data.rich_text_content || null;
        if (contentType === "text" && !richTextContent) {
            richTextContent = createInitialRichTextState(data.title);
        }

        const { data: link, error } = await supabase
            .from("links")
            .insert({
                user_id: userId,
                url: data.url,
                clean_url: data.url, // TODO: Implement URL cleaning
                title: data.title,
                domain,
                content_type: contentType,
                category_id: data.category_id || null,
                color_value: data.color_value || null,
                rich_text_content: richTextContent,
                favicon_url: data.favicon_url || null,
                og_image_url: data.og_image_url || null,
                description: data.description || null,
                is_pinned: false,
                is_archived: false,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create link: ${error.message}`);
        }

        return link;
    }

    /**
     * Update an existing link
     */
    async update(id: string, userId: string, data: UpdateLinkDTO): Promise<Link> {
        const supabase = await createClient();

        const { data: link, error } = await supabase
            .from("links")
            .update(data)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update link: ${error.message}`);
        }

        return link;
    }

    /**
     * Delete a link
     */
    async delete(id: string, userId: string): Promise<void> {
        const supabase = await createClient();

        const { error } = await supabase
            .from("links")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) {
            throw new Error(`Failed to delete link: ${error.message}`);
        }
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
            .eq("is_archived", false);

        // Check if any existing link matches
        const existingLink = links?.find(link => {
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
}
