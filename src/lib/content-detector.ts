export type ContentType = "url" | "color";

export interface DetectedContent {
  type: ContentType;
  value: string;
}

const URL_PATTERN =
  /^(https?:\/\/)?([\ da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

const HEX_COLOR_PATTERN = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Matches 0-255: 0-9, 10-99, 100-199, 200-249, 250-255
const RGB_VALUE = "(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])";

const RGB_COLOR_PATTERN = new RegExp(
  `^rgb\\(${RGB_VALUE},\\s*${RGB_VALUE},\\s*${RGB_VALUE}\\)$`,
  "i"
);

const RGBA_COLOR_PATTERN = new RegExp(
  `^rgba\\(${RGB_VALUE},\\s*${RGB_VALUE},\\s*${RGB_VALUE},\\s*([\\d.]+)\\)$`,
  "i"
);

const HSL_COLOR_PATTERN =
  /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i;

const HSLA_COLOR_PATTERN =
  /^hsla\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%,\s*([\d.]+)\)$/i;

// Modern color formats (CSS Color Module Level 4)
const OKLCH_COLOR_PATTERN =
  /^oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;

const OKLAB_COLOR_PATTERN =
  /^oklab\(([\d.]+%?)\s+([\d.-]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;

const LAB_COLOR_PATTERN =
  /^lab\(([\d.]+%?)\s+([\d.-]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;

const LCH_COLOR_PATTERN =
  /^lch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;

// color() function with various color spaces
const COLOR_FUNCTION_PATTERN =
  /^color\((srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i;

const NAMED_COLORS = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "black",
  "white",
  "gray",
  "grey",
  "brown",
  "cyan",
  "magenta",
  "lime",
  "navy",
  "maroon",
  "olive",
  "teal",
  "aqua",
  "silver",
  "gold",
]);

/**
 * Common valid TLDs for domain validation
 */
const COMMON_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'es', 'it', 'nl', 'be',
  'ru', 'au', 'ca', 'br', 'in', 'jp', 'cn', 'kr', 'mx', 'tv', 'app', 'dev', 'ai', 'me',
  'info', 'biz', 'tech', 'xyz', 'online', 'site', 'blog', 'cloud', 'design', 'studio',
  'store', 'shop', 'news', 'media', 'live', 'video', 'music', 'game', 'games', 'pro',
  'eu', 'us', 'asia', 'africa', 'at', 'ch', 'pl', 'se', 'no', 'fi', 'dk', 'ie', 'nz',
  'pt', 'cz', 'hu', 'ro', 'ua', 'za', 'sg', 'hk', 'tw', 'th', 'id', 'my', 'ph', 'vn'
]);

/**
 * Check if a string looks like a valid domain name
 * e.g., google.com, example.co.uk, sub.domain.org
 * Also handles domain.com/path, domain.com?query, domain.com#hash
 * Rejects single words with trailing dots like "it." or "changes."
 */
function looksLikeValidDomain(input: string): boolean {
  // Remove trailing dots/periods (common in sentences)
  let cleaned = input.replace(/\.+$/, '');
  
  // Extract just the domain part (before any path, query, or hash)
  // This handles cases like "example.com/path" or "example.com?query"
  const pathStart = cleaned.search(/[/?#]/);
  if (pathStart !== -1) {
    cleaned = cleaned.substring(0, pathStart);
  }
  
  // Must contain at least one dot to be a domain
  if (!cleaned.includes('.')) {
    return false;
  }
  
  // Split by dots
  const parts = cleaned.split('.');
  
  // Need at least 2 parts (domain + TLD)
  if (parts.length < 2) {
    return false;
  }
  
  // The last part should be a valid TLD (at least 2 chars, only letters)
  const tld = parts[parts.length - 1].toLowerCase();
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return false;
  }
  
  // Check if it's a known TLD or looks like a country code (2 letters)
  if (!COMMON_TLDS.has(tld) && tld.length !== 2) {
    return false;
  }
  
  // The domain part should have at least 1 character
  const domain = parts[parts.length - 2];
  if (!domain || domain.length === 0) {
    return false;
  }
  
  // Domain parts should only contain alphanumeric and hyphens
  for (const part of parts) {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(part)) {
      return false;
    }
  }
  
  return true;
}

export function detectContentType(input: string): DetectedContent | null {
  const trimmed = input.trim();

  // Check for hex color (with or without #) - must check before URL
  if (HEX_COLOR_PATTERN.test(trimmed)) {
    const normalizedColor = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return { type: "color", value: normalizedColor };
  }

  // Check for rgb/rgba color
  if (RGB_COLOR_PATTERN.test(trimmed) || RGBA_COLOR_PATTERN.test(trimmed)) {
    return { type: "color", value: trimmed };
  }

  // Check for hsl/hsla color
  if (HSL_COLOR_PATTERN.test(trimmed) || HSLA_COLOR_PATTERN.test(trimmed)) {
    return { type: "color", value: trimmed };
  }

  // Check for modern color formats (oklch, oklab, lab, lch)
  if (
    OKLCH_COLOR_PATTERN.test(trimmed) ||
    OKLAB_COLOR_PATTERN.test(trimmed) ||
    LAB_COLOR_PATTERN.test(trimmed) ||
    LCH_COLOR_PATTERN.test(trimmed)
  ) {
    return { type: "color", value: trimmed };
  }

  // Check for color() function
  if (COLOR_FUNCTION_PATTERN.test(trimmed)) {
    return { type: "color", value: trimmed };
  }

  // Check for named colors
  if (NAMED_COLORS.has(trimmed.toLowerCase())) {
    return { type: "color", value: trimmed.toLowerCase() };
  }

  // Check for URL - must match specific patterns, not just anything with a dot
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("www.")
  ) {
    const normalizedUrl = normalizeUrl(trimmed);
    return { type: "url", value: normalizedUrl };
  }

  // Check if it looks like a domain (e.g., google.com, sub.domain.org)
  // Must have at least 2 parts separated by dot, with valid TLD
  if (looksLikeValidDomain(trimmed)) {
    const normalizedUrl = normalizeUrl(trimmed);
    return { type: "url", value: normalizedUrl };
  }

  // If nothing matched, return null - this is not valid content
  return null;
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add https:// if no protocol
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  // Remove www. prefix (optional, but cleaner)
  normalized = normalized.replace(/^https?:\/\/www\./, "https://");

  return normalized;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Splits input string by whitespace only (spaces, tabs, newlines)
 * and returns an array of trimmed, non-empty strings
 * Note: Does NOT split by commas, dashes, or underscores as they're common in URLs
 */
export function splitMultipleContent(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  // Split by whitespace only (spaces, tabs, newlines)
  // Don't split by commas - they can appear in URLs (e.g. https://cubic-bezier.com/#.27,.82,.78,.6)
  const items = input.split(/\s+/);
  
  // Filter out empty strings and trim each item
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Detects content types for multiple items
 * Returns an array of detected content items (filters out invalid content)
 */
export function detectMultipleContentTypes(input: string): DetectedContent[] {
  const items = splitMultipleContent(input);
  
  if (items.length === 0) {
    return [];
  }
  
  // Detect type for each item and filter out nulls (invalid content)
  return items
    .map(item => detectContentType(item))
    .filter((result): result is DetectedContent => result !== null);
}
