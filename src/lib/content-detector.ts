export type ContentType = "url" | "color" | "text";

export interface DetectedContent {
  type: ContentType;
  value: string;
}

const URL_PATTERN =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

const HEX_COLOR_PATTERN = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const RGB_COLOR_PATTERN =
  /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i;

const RGBA_COLOR_PATTERN =
  /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([\d.]+)\)$/i;

const HSL_COLOR_PATTERN =
  /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i;

const HSLA_COLOR_PATTERN =
  /^hsla\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%,\s*([\d.]+)\)$/i;

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

