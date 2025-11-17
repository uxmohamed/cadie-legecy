export type ContentType = "url" | "color" | "text";

export interface DetectedContent {
  type: ContentType;
  value: string;
}

const URL_PATTERN =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

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

export function detectContentType(input: string): DetectedContent {
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: "text", value: trimmed };
  }

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

  // Check for URL
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("www.") ||
    URL_PATTERN.test(trimmed)
  ) {
    const normalizedUrl = normalizeUrl(trimmed);
    return { type: "url", value: normalizedUrl };
  }

  // Default to text
  return { type: "text", value: trimmed };
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
 * Returns an array of detected content items
 */
export function detectMultipleContentTypes(input: string): DetectedContent[] {
  const items = splitMultipleContent(input);
  
  if (items.length === 0) {
    return [];
  }
  
  // If only one item, return single detection
  if (items.length === 1) {
    return [detectContentType(items[0])];
  }
  
  // Detect type for each item
  return items.map(item => detectContentType(item));
}

