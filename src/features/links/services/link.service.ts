import type { ILinkRepository } from "../repositories/link.repository.interface";
import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";
import { MetadataService } from "./metadata.service";
import { DuplicateDetectionService } from "./duplicate-detection.service";
import { enqueueMetadataEnrichment } from "@/lib/job-queue";
import { log } from "@/lib/logger";

/**
 * Service for managing link operations
 * Following Single Responsibility Principle - handles business logic only
 * Following Dependency Inversion Principle - depends on ILinkRepository interface
 */
export class LinkService {
    constructor(
        private linkRepository: ILinkRepository,
        private metadataService: MetadataService,
        private duplicateDetectionService: DuplicateDetectionService
    ) { }

    /**
     * Get all links for a user with optional filters
     */
    async getLinks(userId: string, filters?: LinkFilters, limit?: number, offset?: number, searchQuery?: string): Promise<{ links: Link[], total: number }> {
        return this.linkRepository.findAll(userId, filters, limit, offset, searchQuery);
    }

    /**
     * Get a single link by ID
     */
    async getLink(id: string, userId: string): Promise<Link | null> {
        return this.linkRepository.findById(id, userId);
    }

    /**
     * Create a new link
     * Returns existing link if duplicate is detected
     * Auto-restores from trash if the URL was previously trashed
     * Fetches metadata synchronously for immediate display
     */
    async createLink(userId: string, data: CreateLinkDTO): Promise<{ link: Link; isDuplicate: boolean; isRestored: boolean }> {
        // Check for existing link including trashed ones
        const existingResult = await this.linkRepository.findByUrl(userId, data.url);

        if (existingResult) {
            const { link: existingLink, isInTrash } = existingResult;

            if (isInTrash) {
                // Auto-restore from trash
                const restoredLink = await this.linkRepository.update(existingLink.id, userId, {
                    is_deleted: false,
                    is_archived: false,
                    deleted_at: null,
                });

                // Fetch and update metadata synchronously for restored links
                if (data.content_type === "url" || !data.content_type) {
                    const enrichedLink = await this.enrichLinkWithMetadata(restoredLink, userId);
                    return { link: enrichedLink, isDuplicate: false, isRestored: true };
                }

                return { link: restoredLink, isDuplicate: false, isRestored: true };
            }

            // Link exists and is not in trash - it's a duplicate
            return { link: existingLink, isDuplicate: true, isRestored: false };
        }

        // Create new link
        const link = await this.linkRepository.create(userId, data);

        // Fetch and update metadata synchronously for URLs
        // This ensures the link has complete metadata before being returned
        if (data.content_type === "url" || !data.content_type) {
            const enrichedLink = await this.enrichLinkWithMetadata(link, userId);
            return { link: enrichedLink, isDuplicate: false, isRestored: false };
        }

        return { link, isDuplicate: false, isRestored: false };
    }

    /**
     * Fetch and update metadata for a link synchronously
     * If synchronous fetch fails, enqueues a background job for retry
     * Returns the updated link with metadata (or original link if fetch failed)
     */
    private async enrichLinkWithMetadata(link: Link, userId: string): Promise<Link> {
        try {
            // Fetch metadata with a reasonable timeout
            const metadata = await this.metadataService.fetchMetadata(link.url, 5000);

            // Check if fetch was successful
            if (metadata.fetch_status !== "success") {
                // Synchronous fetch failed - enqueue background retry
                log.info("Synchronous metadata fetch incomplete, enqueuing background retry", { 
                    linkId: link.id, 
                    url: link.url, 
                    fetch_status: metadata.fetch_status 
                });
                await this.enqueueBackgroundRetry(link.id, link.url, userId);
                
                // Still update with whatever we got
                if (metadata.fetch_status) {
                    await this.linkRepository.update(link.id, userId, {
                        fetch_status: metadata.fetch_status,
                        fetched_at: metadata.fetched_at,
                    } as UpdateLinkDTO);
                }
                return link;
            }

            // Build update object with metadata fields
            const updates: Partial<Link> = {
                fetch_status: metadata.fetch_status,
                fetched_at: metadata.fetched_at,
            };

            // Core fields - update if we got better data
            if (metadata.title && metadata.title !== metadata.domain) {
                updates.title = metadata.title;
            }
            if (metadata.favicon_url) {
                updates.favicon_url = metadata.favicon_url;
            }
            if (metadata.preview_image_url) {
                updates.og_image_url = metadata.preview_image_url;
            }
            if (metadata.description) {
                updates.description = metadata.description;
            }

            // Extended metadata fields
            if (metadata.site_name) {
                updates.site_name = metadata.site_name;
            }
            if (metadata.final_url) {
                updates.final_url = metadata.final_url;
            }
            if (metadata.canonical_url) {
                updates.canonical_url = metadata.canonical_url;
            }
            if (metadata.theme_color) {
                updates.theme_color = metadata.theme_color;
            }
            if (metadata.language) {
                updates.language = metadata.language;
            }
            if (metadata.word_count) {
                updates.word_count = metadata.word_count;
            }
            if (metadata.reading_time_minutes) {
                updates.reading_time_minutes = metadata.reading_time_minutes;
            }
            if (metadata.status_code) {
                updates.status_code = metadata.status_code;
            }

            // Update the link with metadata
            const enrichedLink = await this.linkRepository.update(link.id, userId, updates as UpdateLinkDTO);
            return enrichedLink;
        } catch (error) {
            log.warn("Failed to enrich link with metadata, enqueuing background retry", { 
                linkId: link.id, 
                url: link.url, 
                error 
            });
            
            // Enqueue background job for retry (3 retries via QStash)
            await this.enqueueBackgroundRetry(link.id, link.url, userId);
            
            // Return the original link - background job will update it later
            return link;
        }
    }

    /**
     * Enqueue a background job to retry metadata enrichment
     * QStash handles automatic retries (3x)
     */
    private async enqueueBackgroundRetry(linkId: string, url: string, userId: string): Promise<void> {
        try {
            await enqueueMetadataEnrichment({
                linkId,
                url,
                userId,
            });
            log.info("Background metadata retry enqueued", { linkId, url });
        } catch (error) {
            // Log but don't throw - this is best-effort
            log.error("Failed to enqueue background metadata retry", { linkId, url, error });
        }
    }

    /**
     * Update an existing link
     */
    async updateLink(id: string, userId: string, data: UpdateLinkDTO): Promise<Link> {
        return this.linkRepository.update(id, userId, data);
    }

    /**
     * Delete a link
     */
    async deleteLink(id: string, userId: string): Promise<void> {
        return this.linkRepository.delete(id, userId);
    }

    /**
     * Archive a link
     */
    async archiveLink(id: string, userId: string): Promise<Link> {
        return this.linkRepository.update(id, userId, { is_archived: true });
    }

    /**
     * Unarchive a link
     */
    async unarchiveLink(id: string, userId: string): Promise<Link> {
        return this.linkRepository.update(id, userId, { is_archived: false });
    }

    /**
     * Pin a link
     */
    async pinLink(id: string, userId: string): Promise<Link> {
        return this.linkRepository.update(id, userId, { is_pinned: true });
    }

    /**
     * Unpin a link
     */
    async unpinLink(id: string, userId: string): Promise<Link> {
        return this.linkRepository.update(id, userId, { is_pinned: false });
    }

    /**
     * Batch create links
     * Returns summary of successes, duplicates, and failures
     */
    async createBatchLinks(
        userId: string,
        links: CreateLinkDTO[]
    ): Promise<{
        successful: Link[];
        duplicates: number;
        failures: number;
    }> {
        const results = await Promise.allSettled(
            links.map(data => this.createLink(userId, data))
        );

        const successful: Link[] = [];
        let duplicates = 0;
        let failures = 0;

        results.forEach((result) => {
            if (result.status === "fulfilled") {
                if (result.value.isDuplicate) {
                    duplicates++;
                } else {
                    successful.push(result.value.link);
                }
            } else {
                failures++;
            }
        });

        return { successful, duplicates, failures };
    }
}
