import type { Link, CreateLinkDTO, ContentType } from "../types/link.types";
import { canonicalizeContent } from "@/lib/canonicalize";

/**
 * Service for detecting duplicate links
 * Following Single Responsibility Principle
 */
export class DuplicateDetectionService {
    /**
     * Check if a new link is a duplicate of existing links
     */
    isDuplicate(newLink: CreateLinkDTO, existingLinks: Link[]): boolean {
        const contentType = newLink.content_type || "url";
        const canonicalValue = canonicalizeContent(newLink.url, contentType);

        return existingLinks.some((link) => {
            if (link.content_type !== contentType) return false;

            let linkValue = "";
            if (contentType === "color") {
                linkValue = link.color_value || link.title;
            } else if (contentType === "url") {
                linkValue = link.url;
            } else {
                linkValue = link.title;
            }

            const canonicalLinkValue = canonicalizeContent(linkValue, contentType);
            return canonicalLinkValue === canonicalValue;
        });
    }

    /**
     * Normalize a URL for comparison
     * Removes trailing slashes, query params, and fragments
     */
    normalizeUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.replace(/\/$/, '')}`;
        } catch {
            // If URL parsing fails, return original
            return url;
        }
    }

    /**
     * Check if two URLs are equivalent after normalization
     */
    areUrlsEquivalent(url1: string, url2: string): boolean {
        if (url1 === url2) return true;

        try {
            const normalized1 = this.normalizeUrl(url1);
            const normalized2 = this.normalizeUrl(url2);
            return normalized1 === normalized2;
        } catch {
            return false;
        }
    }
}
