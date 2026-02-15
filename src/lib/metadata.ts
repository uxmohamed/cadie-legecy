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
    extractSiteName
} from "./content-analyzer";
import { validateUrlSafety } from "./url-validator";

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

interface ProviderMetadata {
    title?: string;
    description?: string;
    site_name?: string;
    preview_image_url?: string;
    canonical_url?: string;
    content_text?: string;
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
// JSON-LD Extraction
// =============================================================================

function extractJsonLd(ctx: ExtractionContext): any | null {
    const { $ } = ctx;
    let data: any = null;

    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || "{}");
            // Prefer specific types if multiple scripts exist
            // Priority: Article > NewsArticle > BlogPosting > Product > WebPage
            const types = ["Article", "NewsArticle", "BlogPosting", "Product", "WebPage"];
            
            // Handle array of objects or single object
            const items = Array.isArray(json) ? json : [json];
            
            for (const item of items) {
                // If we already found a high-priority type, stick with it unless this one is better
                if (data) {
                    const currentPriority = types.indexOf(data["@type"]);
                    const newPriority = types.indexOf(item["@type"]);
                    if (newPriority !== -1 && (currentPriority === -1 || newPriority < currentPriority)) {
                        data = item;
                    }
                } else {
                    data = item;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    });

    return data;
}

// =============================================================================
// Individual Extractors
// =============================================================================

/**
 * Extract title with priority order:
 * 1. JSON-LD (headline/name)
 * 2. og:title
 * 3. twitter:title
 * 4. <title> element (cleaned of site suffix)
 * 5. First <h1>
 * 6. hostname fallback
 */
function extractTitle(ctx: ExtractionContext, jsonLd: any): string {
    const { $, domain } = ctx;
    
    // Priority 0: JSON-LD
    let title = jsonLd?.headline || jsonLd?.name;

    // Priority 1: OpenGraph title
    if (!title) {
        title = $('meta[property="og:title"]').attr("content");
    }
    
    // Priority 2: Twitter title
    if (!title) {
        title = $('meta[name="twitter:title"]').attr("content");
    }
    
    // Priority 3: <title> element
    if (!title) {
        title = $("title").text();
    }

    // Clean up common site suffix patterns like " | Site Name" or " - Site Name"
    if (title) {
        // Try to find site name to remove it specifically
        const siteName = $('meta[property="og:site_name"]').attr("content") || domain;
        if (siteName && title.includes(siteName)) {
            // Remove site name from end if present with separator
            const regex = new RegExp(`\\s*[\\|\\-\\–\\—]\\s*${escapeRegExp(siteName)}$`, "i");
            title = title.replace(regex, "");
        } else {
            // Generic removal of last segment if it looks like a site name
            title = title.replace(/\s*[\|\-\–\—]\s*[^|\-\–\—]+$/, "").trim();
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
 * 1. JSON-LD (description)
 * 2. og:description
 * 3. twitter:description
 * 4. meta[name="description"]
 * 5. First meaningful <p> in body
 */
function extractDescription(ctx: ExtractionContext, jsonLd: any): string | undefined {
    const { $ } = ctx;
    
    // Priority 0: JSON-LD
    let description = jsonLd?.description;

    // Priority 1: OpenGraph description
    if (!description) {
        description = $('meta[property="og:description"]').attr("content");
    }
    
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
        const paragraphs = $("article p, main p, .content p, p").slice(0, 10); // Look deeper
        for (let i = 0; i < paragraphs.length; i++) {
            const text = $(paragraphs[i]).text().trim();
            // Skip very short paragraphs or those that are just links or nav items
            if (text.length > 50 && !text.match(/^https?:\/\//) && !$(paragraphs[i]).closest("nav, footer, .menu").length) {
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
 * Extract preview image with priority order:
 * 1. JSON-LD (image)
 * 2. og:image
 * 3. twitter:image
 * 4. link[rel="image_src"]
 * 5. Largest valid image in body
 */
function extractPreviewImage(ctx: ExtractionContext, jsonLd: any): string | undefined {
    const { $, baseUrl } = ctx;
    
    // Priority 0: JSON-LD
    let imageUrl = jsonLd?.image?.url || (typeof jsonLd?.image === 'string' ? jsonLd.image : null);

    // Priority 1: OpenGraph image
    if (!imageUrl) {
        imageUrl = $('meta[property="og:image"]').attr("content");
    }
    
    // Priority 2: Twitter image
    if (!imageUrl) {
        imageUrl = $('meta[name="twitter:image"]').attr("content");
        // Also check twitter:image:src
        if (!imageUrl) {
             imageUrl = $('meta[name="twitter:image:src"]').attr("content");
        }
    }

    // Priority 3: link rel="image_src"
    if (!imageUrl) {
        imageUrl = $('link[rel="image_src"]').attr("href");
    }
    
    // Body Fallback: Find largest image
    if (!imageUrl) {
        let maxScore = 0;
        $('img').each((_, el) => {
            const src = $(el).attr('src');
            // Skip SVGs, data URLs, and small icons
            if (!src || src.endsWith('.svg') || src.startsWith('data:') || $(el).closest('nav, footer').length) return;
            
            const width = parseInt($(el).attr('width') || '0', 10);
            const height = parseInt($(el).attr('height') || '0', 10);
            
            // Simple scoring: area
            const score = width * height;
            
            // Filter out small icons (likely social icons, logos)
            if (width > 200 && height > 100 && score > maxScore) {
                maxScore = score;
                imageUrl = src;
            }
        });
    }

    if (!imageUrl) {
        return undefined;
    }
    
    // Resolve relative URLs
    return resolveUrl(imageUrl, baseUrl);
}

// =============================================================================
// Provider-Specific Extraction
// =============================================================================

function trimWithEllipsis(value: string | undefined, maxLength: number): string | undefined {
    const cleaned = cleanText(value);
    if (!cleaned) return undefined;
    if (cleaned.length <= maxLength) return cleaned;
    return `${cleaned.substring(0, maxLength - 3).trimEnd()}...`;
}

function normalizeHostname(hostname: string): string {
    return hostname.toLowerCase().replace(/^www\./, "").replace(/^mobile\./, "").replace(/^m\./, "");
}

function isTwitterStatusUrl(rawUrl: string): boolean {
    try {
        const parsed = new URL(rawUrl);
        const hostname = normalizeHostname(parsed.hostname);
        if (hostname !== "twitter.com" && hostname !== "x.com") {
            return false;
        }
        return /\/[^/]+\/status\/\d+/i.test(parsed.pathname);
    } catch {
        return false;
    }
}

function extractYouTubeId(rawUrl: string): string | null {
    try {
        const parsed = new URL(rawUrl);
        const hostname = normalizeHostname(parsed.hostname);

        if (hostname === "youtube.com") {
            const fromSearch = parsed.searchParams.get("v");
            if (fromSearch && /^[a-zA-Z0-9_-]{11}$/.test(fromSearch)) {
                return fromSearch;
            }

            const pathMatch = parsed.pathname.match(/^\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/i);
            if (pathMatch) {
                return pathMatch[2];
            }
        }

        if (hostname === "youtu.be") {
            const shortMatch = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
            if (shortMatch) {
                return shortMatch[1];
            }
        }

        return null;
    } catch {
        return null;
    }
}

function isGenericTitle(title: string | undefined, domain: string): boolean {
    const normalizedTitle = cleanText(title).toLowerCase();
    if (!normalizedTitle) return true;

    const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
    const rootDomain = normalizedDomain.split(".")[0] || normalizedDomain;
    const genericTitles = new Set([
        normalizedDomain,
        rootDomain,
        "homepage",
        "home",
        "x",
        "x.com",
        "twitter",
        "twitter.com",
        "youtube",
        "youtube.com",
    ]);

    if (genericTitles.has(normalizedTitle)) {
        return true;
    }

    if (
        normalizedTitle.includes("formerly twitter") ||
        normalizedTitle.includes("it's what's happening") ||
        normalizedTitle.includes("it’s what’s happening")
    ) {
        return true;
    }

    if (normalizedTitle.startsWith("youtube") && normalizedTitle.split(/\s+/).length <= 3) {
        return true;
    }

    return false;
}

function extractTweetTextFromOEmbedHtml(html: string): string | undefined {
    if (!html) return undefined;

    try {
        const $ = cheerio.load(html);
        const paragraphText = $("p").first().text();
        const fallbackText = cleanText($.text());
        const rawText = cleanText(paragraphText) || fallbackText;

        const withoutShortLinks = rawText
            .replace(/\bhttps?:\/\/\S+/gi, " ")
            .replace(/\b(?:pic\.twitter\.com|t\.co)\/\S+/gi, " ");

        return cleanText(withoutShortLinks) || undefined;
    } catch {
        return undefined;
    }
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<any | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchTwitterOEmbedMetadata(url: string, timeoutMs: number): Promise<ProviderMetadata | null> {
    if (!isTwitterStatusUrl(url)) {
        return null;
    }

    const endpoint = `https://publish.twitter.com/oembed?omit_script=true&dnt=true&url=${encodeURIComponent(url)}`;
    const payload = await fetchJsonWithTimeout(endpoint, timeoutMs);

    if (!payload || typeof payload !== "object") {
        return null;
    }

    const tweetText = extractTweetTextFromOEmbedHtml(
        typeof payload.html === "string" ? payload.html : ""
    );

    if (!tweetText) {
        return null;
    }

    const title = trimWithEllipsis(tweetText, MAX_TITLE_LENGTH);
    const description = trimWithEllipsis(tweetText, MAX_DESCRIPTION_LENGTH);
    const authorName = cleanText(
        typeof payload.author_name === "string" ? payload.author_name : ""
    );
    const siteName = cleanText(
        typeof payload.provider_name === "string" ? payload.provider_name : "X"
    );
    const canonicalUrl = typeof payload.url === "string"
        ? normalizeUrl(payload.url)
        : normalizeUrl(url);

    const contentText = cleanText(
        [authorName ? `Author: ${authorName}` : "", tweetText]
            .filter(Boolean)
            .join("\n")
    );

    return {
        title,
        description,
        site_name: siteName || "X",
        canonical_url: canonicalUrl,
        content_text: contentText || undefined,
    };
}

async function fetchYouTubeOEmbedMetadata(url: string, timeoutMs: number): Promise<ProviderMetadata | null> {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
        return null;
    }

    const canonicalVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonicalVideoUrl)}`;
    const payload = await fetchJsonWithTimeout(endpoint, timeoutMs);

    if (!payload || typeof payload !== "object") {
        return null;
    }

    const title = trimWithEllipsis(
        typeof payload.title === "string" ? payload.title : "",
        MAX_TITLE_LENGTH
    );

    if (!title) {
        return null;
    }

    const authorName = cleanText(
        typeof payload.author_name === "string" ? payload.author_name : ""
    );
    const providerName = cleanText(
        typeof payload.provider_name === "string" ? payload.provider_name : "YouTube"
    );
    const thumbnail = typeof payload.thumbnail_url === "string" ? payload.thumbnail_url : undefined;
    const description = trimWithEllipsis(
        authorName ? `Video by ${authorName} on YouTube.` : "Video on YouTube.",
        MAX_DESCRIPTION_LENGTH
    );
    const contentText = cleanText(
        [title, authorName ? `Channel: ${authorName}` : ""].filter(Boolean).join("\n")
    );

    return {
        title,
        description,
        site_name: providerName || "YouTube",
        preview_image_url: thumbnail,
        canonical_url: canonicalVideoUrl,
        content_text: contentText || undefined,
    };
}

async function fetchProviderMetadata(url: string, timeoutMs: number): Promise<ProviderMetadata | null> {
    // Keep provider fallbacks fast so they do not delay regular metadata extraction.
    const providerTimeout = Math.max(1200, Math.min(timeoutMs, 4000));

    if (isTwitterStatusUrl(url)) {
        return fetchTwitterOEmbedMetadata(url, providerTimeout);
    }

    if (extractYouTubeId(url)) {
        return fetchYouTubeOEmbedMetadata(url, providerTimeout);
    }

    return null;
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
    const { $, baseUrl } = ctx;
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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
    const domain = extractDomain(url);
    const protocol = extractProtocol(url);
    const fetchedAt = new Date().toISOString();
    
    // SECURITY: Validate URL to prevent SSRF attacks
    const urlValidation = validateUrlSafety(url);
    if (!urlValidation.isValid) {
        return {
            domain,
            protocol,
            title: domain,
            favicon_url: getClearbitFallback(domain),
            fetch_status: "blocked" as FetchStatus,
            fetched_at: fetchedAt,
        };
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const providerMetadataPromise = fetchProviderMetadata(url, timeoutMs);
    
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            signal: controller.signal,
            redirect: "follow",
        });
        
        clearTimeout(timeoutId);
        
        const statusCode = response.status;
        const finalUrl = response.url !== url ? response.url : undefined;
        const etag = response.headers.get("etag") || undefined;
        const lastModified = response.headers.get("last-modified") || undefined;
        const providerMetadata = await providerMetadataPromise;

        const buildProviderFallback = (provider: ProviderMetadata): ExtractedMetadata => ({
            domain,
            protocol,
            title: provider.title || domain,
            description: provider.description,
            site_name: provider.site_name,
            canonical_url: provider.canonical_url,
            preview_image_url: provider.preview_image_url,
            favicon_url: getClearbitFallback(domain),
            status_code: statusCode,
            fetch_status: "success",
            fetched_at: fetchedAt,
            etag,
            last_modified: lastModified,
            content_text: provider.content_text,
        });
        
        if (!response.ok) {
            if (providerMetadata?.title) {
                return buildProviderFallback(providerMetadata);
            }

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
            if (providerMetadata?.title) {
                return buildProviderFallback(providerMetadata);
            }

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

        // Extract JSON-LD first
        const jsonLd = extractJsonLd(ctx);
        
        // Extract all fields
        const extractedTitle = extractTitle(ctx, jsonLd);
        const description = extractDescription(ctx, jsonLd);
        const siteName = extractSiteName($) || jsonLd?.publisher?.name;
        const canonical = extractCanonical(ctx);
        const faviconVariants = extractFavicons(ctx);
        const faviconUrl = selectBestFavicon(faviconVariants, domain);
        const previewImage = extractPreviewImage(ctx, jsonLd);
        const imageDimensions = extractImageDimensions(ctx);
        const language = extractLanguage($) || jsonLd?.inLanguage;
        const themeColor = extractThemeColor($);

        const title = providerMetadata?.title && isGenericTitle(extractedTitle, domain)
            ? providerMetadata.title
            : extractedTitle;
        const finalDescription = description || providerMetadata?.description;
        const finalSiteName = providerMetadata?.site_name || siteName;
        const finalCanonical = canonical || providerMetadata?.canonical_url;
        const finalPreviewImage = previewImage || providerMetadata?.preview_image_url;
        
        // Content analysis
        const visibleText = extractVisibleText($);
        const mergedContentText = cleanText(
            [providerMetadata?.content_text, visibleText].filter(Boolean).join("\n\n")
        );
        const finalContentText = mergedContentText
            ? mergedContentText.substring(0, 5000)
            : undefined;
        const textForMetrics = providerMetadata?.content_text || visibleText;
        const wordCount = countWords(textForMetrics);
        const readingTime = estimateReadingTime(wordCount);
        
        return {
            // URL-level data
            final_url: finalUrl,
            canonical_url: finalCanonical,
            domain,
            protocol,
            
            // Identity/labeling
            title,
            site_name: finalSiteName,
            description: finalDescription,
            
            // Visual identity
            favicon_url: faviconUrl,
            favicon_variants: faviconVariants.length > 0 ? faviconVariants : undefined,
            preview_image_url: finalPreviewImage,
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
            content_text: finalContentText,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        const providerMetadata = await providerMetadataPromise;
        
        const fetchStatus = getFetchStatusFromError(error);
        
        // Log error
        if (error instanceof Error && error.name === "AbortError") {
            console.error("Metadata extraction timeout for:", url);
        } else {
            console.error("Error extracting metadata:", error);
        }

        if (providerMetadata?.title) {
            return {
                domain,
                protocol,
                title: providerMetadata.title,
                description: providerMetadata.description,
                site_name: providerMetadata.site_name,
                canonical_url: providerMetadata.canonical_url,
                preview_image_url: providerMetadata.preview_image_url,
                favicon_url: getClearbitFallback(domain),
                fetch_status: "success",
                fetched_at: fetchedAt,
                content_text: providerMetadata.content_text,
            };
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
