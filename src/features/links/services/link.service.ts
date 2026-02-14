import type { ILinkRepository } from "../repositories/link.repository.interface";
import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";

/**
 * Service for managing link operations
 * Following Single Responsibility Principle - handles business logic only
 * Following Dependency Inversion Principle - depends on ILinkRepository interface
 */
export class LinkService {
    constructor(private linkRepository: ILinkRepository) {}

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
     * Metadata/AI enrichment is intentionally asynchronous
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
                return { link: restoredLink, isDuplicate: false, isRestored: true };
            }

            // Link exists and is not in trash - it's a duplicate
            return { link: existingLink, isDuplicate: true, isRestored: false };
        }

        // Create new link
        const link = await this.linkRepository.create(userId, data);
        return { link, isDuplicate: false, isRestored: false };
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
