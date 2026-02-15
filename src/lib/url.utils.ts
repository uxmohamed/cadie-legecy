/**
 * URL Utilities for normalization and processing
 * Used for deduplication and canonical URL handling
 */

/**
 * Tracking parameters to strip from URLs for normalization
 */
const TRACKING_PARAMS = new Set([
    // UTM parameters
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    // Social media tracking
    "fbclid",
    "gclid",
    "msclkid",
    "twclid",
    "igshid",
    // Email marketing
    "mc_cid",
    "mc_eid",
    // Generic tracking
    "ref",
    "source",
    "_ga",
    "_gl",
    "dclid",
    "zanpid",
    "yclid",
]);

/**
 * Normalize URL for deduplication
 * - Lowercase hostname
 * - Remove trailing slash (except for root path)
 * - Strip tracking parameters
 * - Sort remaining query parameters for consistency
 */
export function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        
        // Lowercase hostname
        urlObj.hostname = urlObj.hostname.toLowerCase();
        
        // Remove tracking parameters
        const params = new URLSearchParams(urlObj.search);
        for (const key of Array.from(params.keys())) {
            if (TRACKING_PARAMS.has(key.toLowerCase())) {
                params.delete(key);
            }
        }
        
        // Sort remaining parameters for consistency
        const sortedParams = new URLSearchParams();
        const keys = Array.from(params.keys()).sort();
        for (const key of keys) {
            sortedParams.set(key, params.get(key)!);
        }
        
        urlObj.search = sortedParams.toString();
        
        // Remove trailing slash (except for root path)
        let normalizedUrl = urlObj.toString();
        if (urlObj.pathname !== "/" && normalizedUrl.endsWith("/")) {
            normalizedUrl = normalizedUrl.slice(0, -1);
        }
        
        return normalizedUrl;
    } catch {
        // If URL parsing fails, return original
        return url;
    }
}

/**
 * Extract and prettify domain from URL
 * Removes "www." prefix and returns lowercase hostname
 * e.g., "https://www.theguardian.com/news" → "theguardian.com"
 */
export function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        // If URL parsing fails, try to extract domain pattern
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
        return match ? match[1].toLowerCase() : url;
    }
}

/**
 * Get the protocol (scheme) from a URL
 * e.g., "https://example.com" → "https"
 */
export function extractProtocol(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol.replace(":", "");
    } catch {
        if (url.startsWith("https://")) return "https";
        if (url.startsWith("http://")) return "http";
        return "unknown";
    }
}

/**
 * Resolve a relative URL against a base URL
 * Handles all forms of relative URLs:
 * - Protocol-relative: "//cdn.example.com/image.png"
 * - Root-relative: "/images/logo.png"
 * - Path-relative: "images/logo.png" or "../logo.png"
 */
export function resolveUrl(relative: string, base: string): string {
    // Skip if already absolute
    if (relative.startsWith("http://") || relative.startsWith("https://")) {
        return relative;
    }
    
    // Skip data URLs
    if (relative.startsWith("data:")) {
        return relative;
    }
    
    try {
        const baseUrl = new URL(base);
        
        // Protocol-relative URL
        if (relative.startsWith("//")) {
            return `${baseUrl.protocol}${relative}`;
        }
        
        // Use URL constructor for resolution
        return new URL(relative, base).toString();
    } catch {
        // If resolution fails, return original
        return relative;
    }
}

/**
 * Validate canonical URL
 * A canonical URL is valid if:
 * 1. It's a valid URL
 * 2. It's on the same domain or a related domain (e.g., m.example.com → example.com)
 */
export function isValidCanonical(canonical: string, originalDomain: string): boolean {
    try {
        const canonicalDomain = extractDomain(canonical);
        const originalDomainClean = originalDomain.toLowerCase().replace(/^www\./, "");
        
        // Exact match
        if (canonicalDomain === originalDomainClean) {
            return true;
        }
        
        // Mobile subdomain (m.example.com → example.com)
        if (canonicalDomain === `m.${originalDomainClean}` || 
            `m.${canonicalDomain}` === originalDomainClean) {
            return true;
        }
        
        // One is subdomain of the other
        if (canonicalDomain.endsWith(`.${originalDomainClean}`) ||
            originalDomainClean.endsWith(`.${canonicalDomain}`)) {
            return true;
        }
        
        return false;
    } catch {
        return false;
    }
}

/**
 * Extract the base URL (origin + pathname without filename)
 * Used for resolving relative URLs
 */
export function getBaseUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Get pathname without file component
        const pathParts = urlObj.pathname.split("/");
        pathParts.pop(); // Remove last segment (filename or empty)
        const basePath = pathParts.join("/") || "/";
        
        return `${urlObj.origin}${basePath}/`;
    } catch {
        return url;
    }
}

/**
 * Check if a URL is likely a tracking pixel or beacon
 * These should be ignored when extracting metadata
 */
export function isTrackingUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    const trackingPatterns = [
        "/pixel",
        "/beacon",
        "/track",
        "/analytics",
        "facebook.com/tr",
        "google-analytics.com",
        "googleadservices.com",
        "doubleclick.net",
        "1x1",
        "spacer.gif",
    ];
    
    return trackingPatterns.some(pattern => lowerUrl.includes(pattern));
}
