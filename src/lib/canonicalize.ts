/**
 * Canonicalization utilities for duplicate detection
 * Converts different representations of the same content to a standard form
 */

/**
 * Converts a color to its canonical format for comparison
 * - Legacy formats (hex, rgb, hsl, named) -> normalized hex
 * - Modern formats (oklch, oklab, lab, lch, color()) -> normalized functional notation
 *
 * Examples:
 * - #F53 -> #ff5533
 * - #FF5733 -> #ff5733
 * - rgb(255, 87, 51) -> #ff5733
 * - hsl(9, 100%, 60%) -> #ff5733 (approximate)
 * - red -> #ff0000
 * - oklch(0.6 0.15 30) -> oklch(0.6 0.15 30)
 * - oklab(0.6 0.1 0.05) -> oklab(0.6 0.1 0.05)
 */
export function canonicalizeColor(color: string): string {
  const trimmed = color.trim().toLowerCase();

  // Check for modern color formats first (preserve them with normalized spacing)
  if (trimmed.startsWith("oklch(")) {
    return normalizeColorFunction(trimmed, "oklch");
  }
  if (trimmed.startsWith("oklab(")) {
    return normalizeColorFunction(trimmed, "oklab");
  }
  if (trimmed.startsWith("lab(")) {
    return normalizeColorFunction(trimmed, "lab");
  }
  if (trimmed.startsWith("lch(")) {
    return normalizeColorFunction(trimmed, "lch");
  }
  if (trimmed.startsWith("color(")) {
    return normalizeColorFunction(trimmed, "color");
  }

  // Handle hex colors
  if (trimmed.match(/^#?[0-9a-f]{3}$/)) {
    // 3-digit hex - expand to 6 digits
    const hex = trimmed.replace("#", "");
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  if (trimmed.match(/^#?[0-9a-f]{6}$/)) {
    // 6-digit hex
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }

  // Handle rgb/rgba
  const rgbMatch = trimmed.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return rgbToHex(Number.parseInt(r), Number.parseInt(g), Number.parseInt(b));
  }

  // Handle hsl/hsla - convert to RGB then to hex
  const hslMatch = trimmed.match(
    /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/,
  );
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    const rgb = hslToRgb(
      Number.parseInt(h),
      Number.parseInt(s),
      Number.parseInt(l),
    );
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // Handle named colors
  const namedColors: Record<string, string> = {
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    yellow: "#ffff00",
    orange: "#ffa500",
    purple: "#800080",
    pink: "#ffc0cb",
    black: "#000000",
    white: "#ffffff",
    gray: "#808080",
    grey: "#808080",
    brown: "#a52a2a",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    lime: "#00ff00",
    navy: "#000080",
    maroon: "#800000",
    olive: "#808000",
    teal: "#008080",
    aqua: "#00ffff",
    silver: "#c0c0c0",
    gold: "#ffd700",
  };

  return namedColors[trimmed] || trimmed;
}

/**
 * Normalizes modern color function notation
 * Converts to consistent spacing and lowercase
 */
function normalizeColorFunction(color: string, functionName: string): string {
  // Remove extra spaces and normalize to single space between values
  const normalized = color
    .replace(/\s+/g, " ")
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
    .replace(/\s*\/\s*/g, " / ");

  return normalized;
}

/**
 * Converts RGB values to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Normalizes a URL for comparison
 * - Removes trailing slashes
 * - Sorts query parameters
 * - Removes common tracking parameters
 * - Normalizes protocol and www
 */
export function canonicalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Normalize hostname (remove www, lowercase)
    let hostname = urlObj.hostname.toLowerCase();
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    // Normalize pathname (remove trailing slash, lowercase)
    let pathname = urlObj.pathname.toLowerCase();
    // Remove trailing slash unless it's the only character (root)
    if (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    // For root path, set to empty string for consistency
    if (pathname === "/") {
      pathname = "";
    }

    // Sort query parameters and remove tracking params
    const trackingParams = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "mc_cid",
      "mc_eid",
      "_ga",
      "ref",
      "source",
    ]);

    const params = new URLSearchParams(urlObj.search);
    const filteredParams = new URLSearchParams();

    // Sort and filter parameters
    const sortedKeys = Array.from(params.keys()).sort();
    for (const key of sortedKeys) {
      if (!trackingParams.has(key.toLowerCase())) {
        filteredParams.set(key.toLowerCase(), params.get(key) || "");
      }
    }

    const queryString = filteredParams.toString();
    const hash = urlObj.hash.toLowerCase();

    // Reconstruct canonical URL
    return `${hostname}${pathname}${queryString ? `?${queryString}` : ""}${hash}`;
  } catch {
    // If URL parsing fails, return lowercase trimmed string
    return url.toLowerCase().trim();
  }
}

/**
 * Canonicalizes content based on its type
 */
export function canonicalizeContent(
  value: string,
  type: "url" | "color" | "text",
): string {
  switch (type) {
    case "color":
      return canonicalizeColor(value);
    case "url":
      return canonicalizeUrl(value);
    case "text":
      // For text, just normalize whitespace and case
      return value.trim().toLowerCase();
    default:
      return value.trim().toLowerCase();
  }
}
