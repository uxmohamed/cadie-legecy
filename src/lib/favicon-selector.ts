/**
 * Favicon Selector
 * Smart favicon selection logic for choosing the best icon from variants
 */

import type { FaviconVariant } from "@/features/links/types/link.types";

/**
 * Target size for favicon selection (32x32 is standard for high DPI displays)
 */
const TARGET_SIZE = 32;

/**
 * Parse size string like "16x16" or "32x32 48x48" and extract sizes as numbers
 * Returns array of sizes (width values)
 */
export function parseSizes(sizes: string | undefined): number[] {
    if (!sizes) return [];
    
    // Match patterns like "16x16", "32x32", "192x192"
    const sizePattern = /(\d+)x\d+/gi;
    const matches = sizes.matchAll(sizePattern);
    
    return Array.from(matches).map(match => parseInt(match[1], 10));
}

/**
 * Find the size closest to target from a list of sizes
 */
export function findClosestSize(sizes: number[], target: number): number | null {
    if (sizes.length === 0) return null;
    
    return sizes.reduce((closest, size) => {
        const closestDiff = Math.abs(closest - target);
        const currentDiff = Math.abs(size - target);
        return currentDiff < closestDiff ? size : closest;
    });
}

/**
 * Score a favicon variant for selection
 * Higher score = better candidate
 * 
 * Scoring criteria:
 * - SVG: +1000 (always preferred)
 * - Size closeness to target: 0-100 (closer = higher)
 * - PNG type: +50
 * - Apple touch icon: +20 (high quality)
 * - Explicit icon rel: +10
 */
export function scoreFavicon(variant: FaviconVariant, targetSize: number = TARGET_SIZE): number {
    let score = 0;
    
    // SVG is always best - resolution independent
    if (variant.type === "image/svg+xml" || variant.url.endsWith(".svg")) {
        return 1000;
    }
    
    // PNG is preferred over ICO
    if (variant.type === "image/png" || variant.url.endsWith(".png")) {
        score += 50;
    }
    
    // Apple touch icons are high quality
    if (variant.rel?.includes("apple-touch-icon")) {
        score += 20;
    }
    
    // Explicit icon rel is better than shortcut icon
    if (variant.rel === "icon") {
        score += 10;
    }
    
    // Size-based scoring
    const sizes = parseSizes(variant.sizes);
    if (sizes.length > 0) {
        const closestSize = findClosestSize(sizes, targetSize)!;
        // Score based on how close to target (max 100 points)
        // Perfect match = 100, further away = less
        const sizeDiff = Math.abs(closestSize - targetSize);
        if (sizeDiff === 0) {
            score += 100;
        } else if (sizeDiff <= 16) {
            score += 80 - sizeDiff * 2;
        } else {
            score += Math.max(0, 50 - sizeDiff);
        }
    }
    
    return score;
}

/**
 * Select the best favicon from a list of variants
 * 
 * Priority order:
 * 1. SVG (resolution independent)
 * 2. PNG closest to 32x32 or 48x48
 * 3. Any PNG
 * 4. First available icon
 * 5. Fallback to domain favicon root or Clearbit
 */
export function selectBestFavicon(
    variants: FaviconVariant[],
    fallbackDomain: string
): string {
    if (!variants || variants.length === 0) {
        return getClearbitFallback(fallbackDomain);
    }
    
    // Score all variants
    const scoredVariants = variants.map(variant => ({
        variant,
        score: scoreFavicon(variant),
    }));
    
    // Sort by score descending
    scoredVariants.sort((a, b) => b.score - a.score);
    
    // Return the best one
    const best = scoredVariants[0];
    if (best && best.score > 0) {
        return best.variant.url;
    }
    
    // If all scores are 0, return first variant or fallback
    if (variants[0]) {
        return variants[0].url;
    }
    
    return getClearbitFallback(fallbackDomain);
}

/**
 * Get Clearbit logo API fallback URL
 */
export function getClearbitFallback(domain: string): string {
    const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
    return `https://logo.clearbit.com/${cleanDomain}`;
}

/**
 * Get default favicon.ico path for a domain
 */
export function getDefaultFaviconPath(baseUrl: string): string {
    try {
        const url = new URL(baseUrl);
        return `${url.origin}/favicon.ico`;
    } catch {
        return `/favicon.ico`;
    }
}

/**
 * Check if a favicon URL is a data URL
 * Data URLs should generally be skipped or handled specially
 */
export function isDataUrl(url: string): boolean {
    return url.startsWith("data:");
}

/**
 * Filter out invalid or problematic favicon variants
 */
export function filterValidFavicons(variants: FaviconVariant[]): FaviconVariant[] {
    return variants.filter(variant => {
        // Skip empty URLs
        if (!variant.url || variant.url.trim() === "") {
            return false;
        }
        
        // Skip data URLs (we store URLs not data)
        if (isDataUrl(variant.url)) {
            return false;
        }
        
        return true;
    });
}
