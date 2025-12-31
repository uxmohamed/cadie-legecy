import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";

/**
 * Repository interface for link data access
 * Following Dependency Inversion Principle - depend on abstractions, not concretions
 */
export interface ILinkRepository {
    /**
     * Find all links for a user with optional filters
     */
    findAll(userId: string, filters?: LinkFilters, limit?: number, offset?: number, searchQuery?: string): Promise<{ links: Link[], total: number }>;

    /**
     * Find a single link by ID
     */
    findById(id: string, userId: string): Promise<Link | null>;

    /**
     * Create a new link
     */
    create(userId: string, data: CreateLinkDTO): Promise<Link>;

    /**
     * Update an existing link
     */
    update(id: string, userId: string, data: UpdateLinkDTO): Promise<Link>;

    /**
     * Delete a link
     */
    delete(id: string, userId: string): Promise<void>;

    /**
     * Check if a link exists for a user
     */
    exists(userId: string, url: string): Promise<Link | null>;

    /**
     * Find a link by URL, including trashed links
     * Returns the link and whether it's currently in trash
     */
    findByUrl(userId: string, url: string): Promise<{ link: Link; isInTrash: boolean } | null>;

    /**
     * Permanently delete links that have been in trash for more than the specified days
     * @param userId - User ID to cleanup for
     * @param daysOld - Number of days after which trashed items should be permanently deleted (default: 60)
     * @returns Number of links deleted
     */
    cleanupExpiredTrash(userId: string, daysOld?: number): Promise<number>;
}

