/**
 * Metadata Extraction Engine
 * Production-grade metadata extraction with priority-based field extraction
 * and comprehensive fallbacks for HTML pages
 */

import * as cheerio from "cheerio";
import type { ExtractedMetadata, FaviconVariant, FetchStatus } from "@/features/links/types/link.types";
import { extractDomain, extractProtocol, resolveUrl, isValidCanonical, normalizeUrl } from "./url.utils";
import { selectBestFavicon, filterValidFavicons, getDefaultFaviconPath, getClearbitFallback } from "./favicon-selector";
import { 
    extractVisibleText, 
    countWords, 
    estimateReadingTime, 
    extractLanguage, 
    extractThemeColor,
    extractSiteName,
    isLoginPage
} from "./content-analyzer";

// =============================================================================
// Legacy Interface (kept for backward compatibility)
// =============================================================================

export interface LinkMetadata {
    title: string;
    description?: string;
    favicon?: string;
    ogImage?: string;
    domain: string;
}

// =============================================================================
// Extraction Context
// =============================================================================

interface ExtractionContext {
    $: cheerio.CheerioAPI;
    url: string;
    baseUrl: string;
    domain: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 280;

// Patterns for descriptions that should be ignored
const IGNORE_DESCRIPTION_PATTERNS = [
    /^log\s*in/i,
    /^sign\s*in/i,
    /^create\s*an?\s*account/i,
    /^join\s+/i,
    /^register\s+/i,
];

// =============================================================================
// Individual Extractors
// =============================================================================

/**
 * Extract title with priority order:
 * 1. og:title
 * 2. twitter:title
 * 3. <title> element (cleaned of site suffix)
 * 4. First <h1>
 * 5. hostname fallback
 */
function extractTitle(ctx: ExtractionContext): string {
    const { $, domain } = ctx;
    
    // Priority 1: OpenGraph title
    let title = $('meta[property="og:title"]').attr("content");
    
    // Priority 2: Twitter title
    if (!title) {
        title = $('meta[name="twitter:title"]').attr("content");
    }
    
    // Priority 3: <title> element
    if (!title) {
        title = $("title").text();
        
        // Clean up common site suffix patterns like " | Site Name" or " - Site Name"
        if (title) {
            title = title
                .replace(/\s*[\|\-\–\—]\s*[^|\-\–\—]+$/, "")
                .trim();
        }
    }
    
    // Priority 4: First h1
    if (!title) {
        title = $("h1").first().text();
    }
    
    // Priority 5: hostname fallback
    if (!title) {
        title = domain;
    }
    
    // Clean up
    title = cleanText(title);
    
    // Limit length
    if (title.length > MAX_TITLE_LENGTH) {
        title = title.substring(0, MAX_TITLE_LENGTH - 3) + "...";
    }
    
    return title || domain;
}

/**
 * Extract description with priority order:
 * 1. og:description
 * 2. twitter:description
 * 3. meta[name="description"]
 * 4. First meaningful <p> in body
 */
function extractDescription(ctx: ExtractionContext): string | undefined {
    const { $ } = ctx;
    
    // Priority 1: OpenGraph description
    let description = $('meta[property="og:description"]').attr("content");
    
    // Priority 2: Twitter description
    if (!description) {
        description = $('meta[name="twitter:description"]').attr("content");
    }
    
    // Priority 3: Meta description
    if (!description) {
        description = $('meta[name="description"]').attr("content");
    }
    
    // Priority 4: First meaningful paragraph
    if (!description) {
        const paragraphs = $("article p, main p, .content p, p").slice(0, 5);
        for (let i = 0; i < paragraphs.length; i++) {
            const text = $(paragraphs[i]).text().trim();
            // Skip very short paragraphs or those that are just links
            if (text.length > 50 && !text.match(/^https?:\/\//)) {
                description = text;
                break;
            }
        }
    }
    
    if (!description) {
        return undefined;
    }
    
    // Clean up
    description = cleanText(description);
    
    // Check for ignored patterns (login pages, etc.)
    if (IGNORE_DESCRIPTION_PATTERNS.some(pattern => pattern.test(description!))) {
        return undefined;
    }
    
    // Limit length
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        description = description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + "...";
    }
    
    return description || undefined;
}

/**
 * Extract canonical URL from <link rel="canonical">
 * Validates that it's on the same or related domain
 */
function extractCanonical(ctx: ExtractionContext): string | undefined {
    const { $, domain, baseUrl } = ctx;
    
    const canonicalHref = $('link[rel="canonical"]').attr("href");
    if (!canonicalHref) {
        return undefined;
    }
    
    // Resolve relative canonical URLs
    const absoluteCanonical = resolveUrl(canonicalHref, baseUrl);
    
    // Validate same domain
    if (!isValidCanonical(absoluteCanonical, domain)) {
        return undefined;
    }
    
    // Normalize the canonical URL
    return normalizeUrl(absoluteCanonical);
}

/**
 * Collect all favicon variants from the page
 */
function extractFavicons(ctx: ExtractionContext): FaviconVariant[] {
    const { $, baseUrl, domain } = ctx;
    const variants: FaviconVariant[] = [];
    
    // Collect from various link elements
    const faviconRels = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="mask-icon"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="apple-touch-icon-precomposed"]',
    ];
    
    for (const selector of faviconRels) {
        $(selector).each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            
            const absoluteUrl = resolveUrl(href, baseUrl);
            
            variants.push({
                url: absoluteUrl,
                sizes: $(el).attr("sizes"),
                type: $(el).attr("type"),
                rel: $(el).attr("rel"),
            });
        });
    }
    
    // Add default favicon.ico as fallback if no variants found
    if (variants.length === 0) {
        variants.push({
            url: getDefaultFaviconPath(baseUrl),
            rel: "icon",
        });
    }
    
    return filterValidFavicons(variants);
}

/**
 * Extract preview image with priority order:
 * 1. og:image
 * 2. twitter:image
 * 3. First decent <img> in content (if we want to implement this later)
 */
function extractPreviewImage(ctx: ExtractionContext): string | undefined {
    const { $, baseUrl } = ctx;
    
    // Priority 1: OpenGraph image
    let imageUrl = $('meta[property="og:image"]').attr("content");
    
    // Priority 2: Twitter image
    if (!imageUrl) {
        imageUrl = $('meta[name="twitter:image"]').attr("content");
    }
    
    // Priority 3: twitter:image:src (some sites use this)
    if (!imageUrl) {
        imageUrl = $('meta[name="twitter:image:src"]').attr("content");
    }
    
    if (!imageUrl) {
        return undefined;
    }
    
    // Resolve relative URLs
    return resolveUrl(imageUrl, baseUrl);
}

/**
 * Extract image dimensions from meta tags
 */
function extractImageDimensions(ctx: ExtractionContext): { width?: number; height?: number } {
    const { $ } = ctx;
    
    const width = $('meta[property="og:image:width"]').attr("content");
    const height = $('meta[property="og:image:height"]').attr("content");
    
    return {
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
    };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Clean text by trimming and collapsing whitespace
 */
function cleanText(text: string | undefined): string {
    if (!text) return "";
    return text
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Determine fetch status from error
 */
function getFetchStatusFromError(error: unknown): FetchStatus {
    if (error instanceof Error) {
        if (error.name === "AbortError") {
            return "timeout";
        }
        if (error.message.includes("SSL") || error.message.includes("certificate")) {
            return "invalid_ssl";
        }
        if (error.message.includes("403") || error.message.includes("blocked")) {
            return "blocked";
        }
    }
    return "failed";
}

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extract comprehensive metadata from a URL
 * This is the production-grade extraction function with all fields
 */
export async function extractMetadata(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<ExtractedMetadata> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const domain = extractDomain(url);
    const protocol = extractProtocol(url);
    const fetchedAt = new Date().toISOString();
    
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; CadieBot/1.0; +https://cadie.app)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            signal: controller.signal,
            redirect: "follow",
        });
        
        clearTimeout(timeoutId);
        
        const statusCode = response.status;
        const finalUrl = response.url !== url ? response.url : undefined;
        const etag = response.headers.get("etag") || undefined;
        const lastModified = response.headers.get("last-modified") || undefined;
        
        if (!response.ok) {
            return {
                domain,
                protocol,
                title: domain,
                favicon_url: getClearbitFallback(domain),
                status_code: statusCode,
                fetch_status: statusCode === 403 ? "blocked" : "failed",
                fetched_at: fetchedAt,
            };
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Check if we can parse HTML
        if (!$("html").length && !$("head").length && !$("body").length) {
            return {
                domain,
                protocol,
                title: domain,
                favicon_url: getClearbitFallback(domain),
                status_code: statusCode,
                fetch_status: "invalid_html",
                fetched_at: fetchedAt,
            };
        }
        
        // Create extraction context
        const ctx: ExtractionContext = {
            $,
            url,
            baseUrl: finalUrl || url,
            domain,
        };
        
        // Extract all fields
        const title = extractTitle(ctx);
        const description = extractDescription(ctx);
        const siteName = extractSiteName($);
        const canonical = extractCanonical(ctx);
        const faviconVariants = extractFavicons(ctx);
        const faviconUrl = selectBestFavicon(faviconVariants, domain);
        const previewImage = extractPreviewImage(ctx);
        const imageDimensions = extractImageDimensions(ctx);
        const language = extractLanguage($);
        const themeColor = extractThemeColor($);
        
        // Content analysis
        const visibleText = extractVisibleText($);
        const wordCount = countWords(visibleText);
        const readingTime = estimateReadingTime(wordCount);
        
        return {
            // URL-level data
            final_url: finalUrl,
            canonical_url: canonical,
            domain,
            protocol,
            
            // Identity/labeling
            title,
            site_name: siteName,
            description,
            
            // Visual identity
            favicon_url: faviconUrl,
            favicon_variants: faviconVariants.length > 0 ? faviconVariants : undefined,
            preview_image_url: previewImage,
            preview_image_width: imageDimensions.width,
            preview_image_height: imageDimensions.height,
            theme_color: themeColor,
            
            // Content signals
            language,
            word_count: wordCount > 0 ? wordCount : undefined,
            reading_time_minutes: readingTime > 0 ? readingTime : undefined,
            
            // System info
            status_code: statusCode,
            fetch_status: "success",
            fetched_at: fetchedAt,
            etag,
            last_modified: lastModified,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        const fetchStatus = getFetchStatusFromError(error);
        
        // Log error
        if (error instanceof Error && error.name === "AbortError") {
            console.error("Metadata extraction timeout for:", url);
        } else {
            console.error("Error extracting metadata:", error);
        }
        
        // Return fallback metadata
        return {
            domain,
            protocol,
            title: domain,
            favicon_url: getClearbitFallback(domain),
            fetch_status: fetchStatus,
            fetched_at: fetchedAt,
        };
    }
}

// =============================================================================
// Legacy Function (for backward compatibility)
// =============================================================================

/**
 * Extract basic metadata (legacy function for backward compatibility)
 * @deprecated Use extractMetadata() instead for comprehensive extraction
 */
export async function extractMetadataLegacy(url: string): Promise<LinkMetadata> {
    const result = await extractMetadata(url);
    
    return {
        title: result.title,
        description: result.description,
        favicon: result.favicon_url,
        ogImage: result.preview_image_url,
        domain: result.domain,
    };
}
