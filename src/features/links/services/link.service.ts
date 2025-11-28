import type { ILinkRepository } from "../repositories/link.repository.interface";
import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";
import { MetadataService } from "./metadata.service";
import { DuplicateDetectionService } from "./duplicate-detection.service";

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
    async getLinks(userId: string, filters?: LinkFilters): Promise<Link[]> {
        return this.linkRepository.findAll(userId, filters);
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
     */
    async createLink(userId: string, data: CreateLinkDTO): Promise<{ link: Link; isDuplicate: boolean }> {
        // Check for duplicates using repository
        const existingLink = await this.linkRepository.exists(userId, data.url);

        if (existingLink) {
            return { link: existingLink, isDuplicate: true };
        }

        // Create the link
        const link = await this.linkRepository.create(userId, data);

        // Trigger background metadata enrichment for URLs
        if (data.content_type === "url" || !data.content_type) {
            // Fire and forget - don't wait for metadata
            this.metadataService.enrichLink(link.id, data.url).catch(err => {
                console.error('Background metadata enrichment failed:', err);
            });
        }

        return { link, isDuplicate: false };
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
