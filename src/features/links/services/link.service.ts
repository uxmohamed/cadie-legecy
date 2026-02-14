import type { ILinkRepository } from "../repositories/link.repository.interface";
import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";
import { MetadataService } from "./metadata.service";
import { DuplicateDetectionService } from "./duplicate-detection.service";
import { AITaggingService } from "./ai-tagging.service";

/**
 * Service for managing link operations
 * Following Single Responsibility Principle - handles business logic only
 * Following Dependency Inversion Principle - depends on ILinkRepository interface
 */
export class LinkService {
    private aiTaggingService: AITaggingService;

    constructor(
        private linkRepository: ILinkRepository,
        private metadataService: MetadataService,
        private duplicateDetectionService: DuplicateDetectionService
    ) {
        this.aiTaggingService = new AITaggingService();
    }

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
                    await this.metadataService.enrichLink(restoredLink.id, restoredLink.url);
                    const refreshed = await this.linkRepository.findById(restoredLink.id, userId);
                    const enriched = await this.enrichLinkAI(refreshed || restoredLink, userId);
                    return { link: enriched, isDuplicate: false, isRestored: true };
                }

                const enriched = await this.enrichLinkAI(restoredLink, userId);
                return { link: enriched, isDuplicate: false, isRestored: true };
            }

            // Link exists and is not in trash - it's a duplicate
            return { link: existingLink, isDuplicate: true, isRestored: false };
        }

        // Create new link
        const link = await this.linkRepository.create(userId, data);

        // Fetch and update metadata synchronously for URLs
        // This ensures the link has complete metadata before being returned
        if (data.content_type === "url" || !data.content_type) {
            await this.metadataService.enrichLink(link.id, link.url);
            const refreshed = await this.linkRepository.findById(link.id, userId);
            const enriched = await this.enrichLinkAI(refreshed || link, userId);
            return { link: enriched, isDuplicate: false, isRestored: false };
        }

        const enriched = await this.enrichLinkAI(link, userId);
        return { link: enriched, isDuplicate: false, isRestored: false };
    }

    private async enrichLinkAI(link: Link, userId: string): Promise<Link> {
        try {
            if (link.content_type === "color") {
                return link;
            }

            if (link.content_type === "image") {
                const result = await this.aiTaggingService.generateTagsFromImage(link.og_image_url || link.url);
                if (!result) {
                    return this.linkRepository.update(link.id, userId, {
                        fetch_status: "failed",
                        fetched_at: new Date().toISOString(),
                    });
                }

                return this.linkRepository.update(link.id, userId, {
                    ai_tags: result.tags,
                    ai_key_themes: { category: result.category },
                    title: result.title || (result.description ? result.description.split(/\s+/).slice(0, 5).join(" ") : link.title),
                    description: result.description || link.description,
                    fetch_status: "success",
                    fetched_at: new Date().toISOString(),
                });
            }

            if (link.ai_tags && link.ai_tags.length > 0) {
                return link;
            }

            const result = await this.aiTaggingService.generateTags({
                title: link.title,
                description: link.description,
                domain: link.domain,
                site_name: link.site_name,
                content: link.content_text,
            });

            if (!result) {
                return link;
            }

            return this.linkRepository.update(link.id, userId, {
                ai_tags: result.tags,
                ai_key_themes: { category: result.category },
            });
        } catch {
            return link;
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
