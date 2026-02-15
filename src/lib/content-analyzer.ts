/**
 * Content Analyzer
 * Utilities for analyzing HTML content (word count, reading time, language)
 */

import type * as cheerio from "cheerio";

/**
 * Average reading speed in words per minute
 * 200 WPM is a commonly used average for silent reading
 */
const WORDS_PER_MINUTE = 200;

/**
 * Minimum word count to be considered meaningful content
 */
const MIN_MEANINGFUL_WORDS = 50;

/**
 * Extract visible text from HTML, stripping scripts, styles, and navigation
 * Returns clean text content suitable for word counting
 */
export function extractVisibleText($: cheerio.CheerioAPI): string {
    // Clone to avoid modifying original
    const $clone = $.root().clone();
    
    // Remove non-content elements
    $clone.find("script, style, noscript, nav, header, footer, aside, form, [role='navigation'], [role='banner'], [role='contentinfo']").remove();
    
    // Extract text from main content areas if available
    const mainContent = $clone.find("main, article, [role='main'], .content, .post, .article, .entry-content");
    
    let text: string;
    if (mainContent.length > 0) {
        text = mainContent.text();
    } else {
        // Fallback to body
        text = $clone.find("body").text();
    }
    
    // Clean up whitespace
    return text
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Count words in text
 * Uses a simple word boundary approach that works across languages
 */
export function countWords(text: string): number {
    if (!text || text.trim().length === 0) {
        return 0;
    }
    
    // Split on whitespace and filter out empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    return words.length;
}

/**
 * Estimate reading time in minutes
 * Based on average reading speed of 200 WPM
 */
export function estimateReadingTime(wordCount: number): number {
    if (wordCount <= 0) {
        return 0;
    }
    
    const minutes = wordCount / WORDS_PER_MINUTE;
    
    // Round to nearest minute, minimum 1 minute for any meaningful content
    return Math.max(1, Math.round(minutes));
}

/**
 * Extract language from HTML
 * Checks <html lang="..."> and <meta http-equiv="content-language">
 */
export function extractLanguage($: cheerio.CheerioAPI): string | undefined {
    // Priority 1: html lang attribute
    const htmlLang = $("html").attr("lang");
    if (htmlLang) {
        // Return just the primary language code (e.g., "en" from "en-US")
        return htmlLang.split("-")[0].toLowerCase();
    }
    
    // Priority 2: meta http-equiv content-language
    const metaLang = $('meta[http-equiv="content-language"]').attr("content");
    if (metaLang) {
        return metaLang.split("-")[0].toLowerCase();
    }
    
    // Priority 3: meta name=language
    const metaNameLang = $('meta[name="language"]').attr("content");
    if (metaNameLang) {
        return metaNameLang.split("-")[0].toLowerCase();
    }
    
    return undefined;
}

/**
 * Extract theme color from meta tag
 * Used for brand/accent color in UI
 */
export function extractThemeColor($: cheerio.CheerioAPI): string | undefined {
    const themeColor = $('meta[name="theme-color"]').attr("content");
    if (themeColor && isValidColor(themeColor)) {
        return themeColor;
    }
    
    // Fallback: msapplication-TileColor (Windows tiles)
    const tileColor = $('meta[name="msapplication-TileColor"]').attr("content");
    if (tileColor && isValidColor(tileColor)) {
        return tileColor;
    }
    
    return undefined;
}

/**
 * Basic validation for CSS color values
 */
function isValidColor(color: string): boolean {
    const trimmed = color.trim();
    
    // Hex colors
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) {
        return true;
    }
    
    // RGB/RGBA
    if (/^rgba?\s*\(/.test(trimmed)) {
        return true;
    }
    
    // HSL/HSLA
    if (/^hsla?\s*\(/.test(trimmed)) {
        return true;
    }
    
    // Named colors (common ones)
    const namedColors = [
        "white", "black", "red", "green", "blue", "yellow", "orange", 
        "purple", "pink", "gray", "grey", "transparent"
    ];
    if (namedColors.includes(trimmed.toLowerCase())) {
        return true;
    }
    
    return false;
}

/**
 * Extract site name from meta tags
 */
export function extractSiteName($: cheerio.CheerioAPI): string | undefined {
    // Priority 1: og:site_name
    const ogSiteName = $('meta[property="og:site_name"]').attr("content");
    if (ogSiteName && ogSiteName.trim().length > 0) {
        return ogSiteName.trim();
    }
    
    // Priority 2: application-name
    const appName = $('meta[name="application-name"]').attr("content");
    if (appName && appName.trim().length > 0) {
        return appName.trim();
    }
    
    return undefined;
}

/**
 * Check if content appears to be meaningful
 * Helps filter out login pages, error pages, etc.
 */
export function hasMeaningfulContent($: cheerio.CheerioAPI): boolean {
    const text = extractVisibleText($);
    const wordCount = countWords(text);
    
    return wordCount >= MIN_MEANINGFUL_WORDS;
}

/**
 * Detect if the page is likely a login/auth page
 * These often have generic descriptions that should be ignored
 */
export function isLoginPage($: cheerio.CheerioAPI): boolean {
    const title = $("title").text().toLowerCase();
    const bodyText = $("body").text().toLowerCase();
    
    const loginPatterns = [
        "log in",
        "login",
        "sign in",
        "signin",
        "authenticate",
        "password",
    ];
    
    // Check if login-related terms appear prominently
    const titleHasLogin = loginPatterns.some(p => title.includes(p));
    
    // Check for login forms
    const hasLoginForm = $('input[type="password"]').length > 0 ||
                         $('form[action*="login"]').length > 0 ||
                         $('form[action*="signin"]').length > 0;
    
    return titleHasLogin || hasLoginForm;
}
