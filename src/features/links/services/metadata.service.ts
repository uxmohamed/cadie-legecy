import type { LinkMetadata, ExtractedMetadata, BatchMetadataOptions, FetchStatus } from "../types/link.types";
import { extractMetadata } from "@/lib/metadata";
import { log } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Default options for batch metadata fetching
 */
const DEFAULT_BATCH_OPTIONS: Required<BatchMetadataOptions> = {
    timeout: 5000,
    concurrency: 5,
    skipCache: false,
};

/**
 * Service for fetching and managing link metadata
 * Following Single Responsibility Principle
 */
export class MetadataService {
    private readonly MAX_RETRIES = 3;
    private readonly INITIAL_BACKOFF_MS = 1000;

    /**
     * Sleep utility for exponential backoff
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch comprehensive metadata for a given URL with retry logic
     */
    async fetchMetadata(url: string, timeoutMs?: number): Promise<ExtractedMetadata> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
            try {
                const metadata = await extractMetadata(url, timeoutMs);
                return metadata;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Don't retry on the last attempt
                if (attempt < this.MAX_RETRIES - 1) {
                    // Exponential backoff: 1s, 2s, 4s
                    const backoffMs = this.INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                    log.warn(`Metadata fetch attempt ${attempt + 1} failed, retrying in ${backoffMs}ms`, { url, attempt: attempt + 1, backoffMs });
                    await this.sleep(backoffMs);
                }
            }
        }

        // All retries exhausted
        log.error(`Metadata fetch failed after ${this.MAX_RETRIES} attempts`, lastError, { url, maxRetries: this.MAX_RETRIES });

        // Return fallback metadata
        const domain = extractDomainFromUrl(url);
        return {
            domain,
            title: domain,
            fetch_status: "failed" as FetchStatus,
            fetched_at: new Date().toISOString(),
        };
    }

    /**
     * Fetch legacy metadata format (for backward compatibility)
     * @deprecated Use fetchMetadata() for comprehensive extraction
     */
    async fetchMetadataLegacy(url: string): Promise<LinkMetadata> {
        const metadata = await this.fetchMetadata(url);
        return {
            title: metadata.title,
            description: metadata.description,
            favicon: metadata.favicon_url,
            ogImage: metadata.preview_image_url,
            domain: metadata.domain,
        };
    }

    /**
     * Fetch metadata for multiple URLs with concurrency control
     */
    async fetchBatchMetadata(
        urls: string[],
        options?: BatchMetadataOptions
    ): Promise<Map<string, ExtractedMetadata>> {
        const opts = { ...DEFAULT_BATCH_OPTIONS, ...options };
        const results = new Map<string, ExtractedMetadata>();
        
        // Process URLs in batches based on concurrency limit
        const batches = this.chunkArray(urls, opts.concurrency);
        
        for (const batch of batches) {
            const batchPromises = batch.map(async (url) => {
                try {
                    const metadata = await extractMetadata(url, opts.timeout);
                    results.set(url, metadata);
                } catch (error) {
                    log.error(`Batch metadata fetch failed for ${url}`, error);
                    const domain = extractDomainFromUrl(url);
                    results.set(url, {
                        domain,
                        title: domain,
                        fetch_status: "failed" as FetchStatus,
                        fetched_at: new Date().toISOString(),
                    });
                }
            });
            
            await Promise.all(batchPromises);
        }
        
        return results;
    }

    /**
     * Enrich a link with metadata by making an API call with retry logic
     * This is used for background metadata enrichment
     * Skips enrichment for non-URL content types (e.g., colors)
     */
    async enrichLink(linkId: string, url: string, contentType?: string, userId?: string): Promise<string> {
        // Skip enrichment for non-URL content types
        if (contentType && contentType !== "url") {
            log.info(`Skipping metadata enrichment for non-URL content type: ${contentType}`, { linkId });
            return "success";
        }

        try {
            log.info(`[EnrichLink] Starting metadata enrichment for ${linkId}`);
            const metadata = await extractMetadata(url);
            
            if (metadata.fetch_status === "success") {
                const supabase = createAdminClient();

                let query = supabase
                  .from("links")
                  .update({
                    title: metadata.title,
                    description: metadata.description,
                    og_image_url: metadata.preview_image_url,
                    favicon_url: metadata.favicon_url,
                    site_name: metadata.site_name,
                    fetch_status: "success",
                    fetched_at: metadata.fetched_at,
                  })
                  .eq("id", linkId);

                if (userId) {
                    query = query.eq("user_id", userId);
                }

                const { error } = await query;

                if (error) {
                    log.error(`[EnrichLink] Failed to update metadata for ${linkId}`, error);
                    throw error;
                } else {
                    log.info(`[EnrichLink] Successfully updated metadata for ${linkId}`);
                }
                return "success";
            } else {
                // Update with failure status but preserve url as title if needed
                const supabase = createAdminClient();
                let query = supabase
                  .from("links")
                  .update({
                    fetch_status: metadata.fetch_status,
                    fetched_at: metadata.fetched_at,
                  })
                  .eq("id", linkId);

                if (userId) {
                    query = query.eq("user_id", userId);
                }

                const { error } = await query;
                if (error) {
                    log.error(`[EnrichLink] Failed to update metadata status for ${linkId}`, error);
                    throw error;
                }

                log.warn(`[EnrichLink] Metadata extraction completed with status ${metadata.fetch_status}`, { linkId });
                return metadata.fetch_status;
            }
        } catch (error) {
            log.error(`[EnrichLink] Metadata enrichment failed`, error);
            throw error instanceof Error ? error : new Error(String(error));
        }
    }

    /**
     * Enrich a link with metadata directly in-process (no API calls)
     * Best for development environment or server-side processing where DB access is available
     */


    /**
     * Batch enrich multiple links with metadata
     */
    async enrichBatchLinks(
        links: Array<{ id: string; url: string; content_type?: string }>
    ): Promise<{ successful: number; failed: number }> {
        // Filter to only URL content types
        const urlLinks = links.filter(link => !link.content_type || link.content_type === "url");
        
        if (urlLinks.length === 0) {
            return { successful: 0, failed: 0 };
        }

        let successful = 0;
        let failed = 0;

        // Fetch metadata for all URLs
        const urls = urlLinks.map(link => link.url);
        
        // Use higher concurrency for background jobs
        const metadataMap = await this.fetchBatchMetadata(urls, { concurrency: 10, timeout: 8000 });
        
        // Initializing Supabase client for direct updates
        const supabase = createAdminClient();

        for (const link of urlLinks) {
            const metadata = metadataMap.get(link.url);
            if (!metadata || metadata.fetch_status !== "success") {
                failed++;
                // Still update failed status
                if (metadata) {
                     await supabase
                        .from("links")
                        .update({
                            fetch_status: metadata.fetch_status,
                            fetched_at: metadata.fetched_at,
                        })
                        .eq("id", link.id);
                }
                continue;
            }

            try {
                // Update the link in the database DIRECTLY (In-Process)
                // This bypasses internal API network issues
                const { error } = await supabase
                    .from("links")
                    .update({
                        title: metadata.title,
                        description: metadata.description,
                        og_image_url: metadata.preview_image_url,
                        favicon_url: metadata.favicon_url,
                        site_name: metadata.site_name,
                        final_url: metadata.final_url,
                        canonical_url: metadata.canonical_url,
                        favicon_variants: metadata.favicon_variants,
                        preview_image_width: metadata.preview_image_width,
                        preview_image_height: metadata.preview_image_height,
                        theme_color: metadata.theme_color,
                        language: metadata.language,
                        word_count: metadata.word_count,
                        reading_time_minutes: metadata.reading_time_minutes,
                        status_code: metadata.status_code,
                        fetch_status: "success",
                        fetched_at: metadata.fetched_at,
                        etag: metadata.etag,
                        last_modified: metadata.last_modified,
                    })
                    .eq("id", link.id);

                if (!error) {
                    successful++;
                } else {
                    log.error(`Failed to update link ${link.id} in DB`, error);
                    failed++;
                }
            } catch (error) {
                log.error(`Failed to update link ${link.id} with metadata`, error);
                failed++;
            }
        }

        return { successful, failed };
    }

    /**
     * Helper to chunk array for batch processing
     */
    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

/**
 * Simple domain extraction helper
 */
function extractDomainFromUrl(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}
