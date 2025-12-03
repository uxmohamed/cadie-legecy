import type { LinkMetadata } from "../types/link.types";
import { extractMetadata } from "@/lib/metadata";
import { AppError, ErrorCode } from "@/lib/errors";
import { log } from "@/lib/logger";

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
     * Fetch metadata for a given URL with retry logic
     */
    async fetchMetadata(url: string): Promise<LinkMetadata> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
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

        // Return empty metadata rather than throwing - metadata enrichment is optional
        return {};
    }

    /**
     * Enrich a link with metadata by making an API call with retry logic
     * This is used for background metadata enrichment
     */
    async enrichLink(linkId: string, url: string): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

                const response = await fetch(`${baseUrl}/api/links/${linkId}/metadata`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Internal-Request': 'true'
                    },
                });

                if (response.ok) {
                    return; // Success
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Don't retry on the last attempt
                if (attempt < this.MAX_RETRIES - 1) {
                    // Exponential backoff: 1s, 2s, 4s
                    const backoffMs = this.INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                    log.warn(`Background enrichment attempt ${attempt + 1} failed, retrying in ${backoffMs}ms`, { linkId, url, attempt: attempt + 1, backoffMs });
                    await this.sleep(backoffMs);
                }
            }
        }

        // All retries exhausted - log and fail silently
        log.error(`Background metadata enrichment failed after ${this.MAX_RETRIES} attempts`, lastError, { linkId, url, maxRetries: this.MAX_RETRIES });
    }
}
