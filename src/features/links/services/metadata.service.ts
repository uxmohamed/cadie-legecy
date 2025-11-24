import type { LinkMetadata } from "../types/link.types";
import { extractMetadata } from "@/lib/metadata";

/**
 * Service for fetching and managing link metadata
 * Following Single Responsibility Principle
 */
export class MetadataService {
    /**
     * Fetch metadata for a given URL
     */
    async fetchMetadata(url: string): Promise<LinkMetadata> {
        try {
            const metadata = await extractMetadata(url);

            return {
                title: metadata?.title,
                description: metadata?.description,
                favicon: metadata?.favicon,
                ogImage: metadata?.ogImage,
                domain: metadata?.domain,
            };
        } catch (error) {
            console.error("Error fetching metadata:", error);
            // Return empty metadata on error
            return {};
        }
    }

    /**
     * Enrich a link with metadata by making an API call
     * This is used for background metadata enrichment
     */
    async enrichLink(linkId: string, url: string): Promise<void> {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

            await fetch(`${baseUrl}/api/links/${linkId}/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Request': 'true'
                },
            });
        } catch (error) {
            console.error('Background metadata enrichment failed:', error);
            // Fail silently - this is a background operation
        }
    }
}
