import type { Link, CreateLinkDTO, UpdateLinkDTO, LinkFilters } from "../types/link.types";

/**
 * Repository interface for link data access
 * Following Dependency Inversion Principle - depend on abstractions, not concretions
 */
export interface ILinkRepository {
    /**
     * Find all links for a user with optional filters
     */
    findAll(userId: string, filters?: LinkFilters): Promise<Link[]>;

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
}
