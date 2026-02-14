/**
 * Canonicalization utilities for duplicate detection
 * Converts different representations of the same content to a standard form
 */

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface LabColor {
  l: number;
  a: number;
  b: number;
}

interface NamedColorLab {
  name: string;
  hex: string;
  lab: LabColor;
}

export interface ColorMetadata {
  colorCode: string;
  colorName: string;
  source: "named" | "exact" | "nearest" | "custom";
  confidence: number;
}

const CSS_NAMED_COLORS: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  transparent: "transparent",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

const COLOR_NAME_TOKENS = [
  "lightgoldenrod",
  "mediumaquamarine",
  "mediumspringgreen",
  "palegoldenrod",
  "rebeccapurple",
  "cornflower",
  "goldenrod",
  "aquamarine",
  "chartreuse",
  "whitesmoke",
  "springgreen",
  "paleturquoise",
  "mediumviolet",
  "slategray",
  "slategrey",
  "lightsteel",
  "lightslate",
  "lavender",
  "cornsilk",
  "darkslate",
  "darkolive",
  "blanched",
  "firebrick",
  "seagreen",
  "forest",
  "saddlebrown",
  "oldlace",
  "papaya",
  "peach",
  "navajo",
  "honey",
  "indian",
  "medium",
  "midnight",
  "powder",
  "royal",
  "sandy",
  "turquoise",
  "violet",
  "yellowgreen",
  "yellow",
  "orange",
  "orchid",
  "purple",
  "silver",
  "crimson",
  "magenta",
  "fuchsia",
  "gainsboro",
  "alice",
  "antique",
  "aqua",
  "azure",
  "beige",
  "bisque",
  "black",
  "blue",
  "brown",
  "burly",
  "cadet",
  "chocolate",
  "coral",
  "cyan",
  "dark",
  "deep",
  "dim",
  "dodger",
  "floral",
  "ghost",
  "gold",
  "gray",
  "grey",
  "green",
  "hot",
  "indigo",
  "ivory",
  "khaki",
  "lawn",
  "lemon",
  "light",
  "lime",
  "linen",
  "maroon",
  "mint",
  "misty",
  "moccasin",
  "navy",
  "olive",
  "pale",
  "peru",
  "pink",
  "plum",
  "red",
  "rosy",
  "salmon",
  "sea",
  "seashell",
  "sienna",
  "sky",
  "slate",
  "snow",
  "steel",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "transparent",
  "wheat",
  "white",
  "smoke",
];

const COLOR_NAME_LOOKUP = new Map<string, string>();
const HEX_TO_PREFERRED_NAME = new Map<string, string>();
const NAMED_COLOR_LAB_ENTRIES: NamedColorLab[] = [];

for (const [name, hex] of Object.entries(CSS_NAMED_COLORS)) {
  COLOR_NAME_LOOKUP.set(normalizeColorNameKey(name), name);
  if (isHexColor(hex) && !HEX_TO_PREFERRED_NAME.has(hex)) {
    HEX_TO_PREFERRED_NAME.set(hex, name);
    const rgb = hexToRgb(hex);
    if (rgb) {
      NAMED_COLOR_LAB_ENTRIES.push({
        name,
        hex,
        lab: rgbToLab(rgb),
      });
    }
  }
}

export function normalizeColorNameKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isNamedColor(value: string): boolean {
  return (
    COLOR_NAME_LOOKUP.has(normalizeColorNameKey(value)) ||
    resolveDescriptiveColorName(value) !== null
  );
}

export function getNamedColorHex(value: string): string | null {
  const canonicalName = COLOR_NAME_LOOKUP.get(normalizeColorNameKey(value));
  if (canonicalName) {
    return CSS_NAMED_COLORS[canonicalName] || null;
  }

  return resolveDescriptiveColorName(value);
}



function resolveDescriptiveColorName(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z\s_-]+$/.test(normalized)) return null;

  const terms = normalized.split(/[\s_-]+/).filter(Boolean);
  if (terms.length < 2 || terms.length > 6) return null;

  const colorTermIndexes = terms
    .map((term, index) => ({
      index,
      hex: getNamedColorHex(term),
    }))
    .filter((entry) => entry.hex && isHexColor(entry.hex));

  if (colorTermIndexes.length === 0) return null;

  const base = colorTermIndexes[colorTermIndexes.length - 1];
  const baseRgb = hexToRgb(base.hex!);
  if (!baseRgb) return null;

  const modifiers = terms.filter((_, index) => index !== base.index);
  if (modifiers.length === 0) return null;

  const hsl = rgbToHsl(baseRgb);
  const modifierHash = hashString(modifiers.join(" "));

  const modifierIntensity = Math.min(1, 0.35 + modifiers.length * 0.2);
  const deltaH = ((modifierHash % 49) - 24) * modifierIntensity;
  const deltaS = (((modifierHash >> 8) % 41) - 20) * modifierIntensity;
  const deltaL = (((modifierHash >> 16) % 37) - 18) * modifierIntensity;

  hsl.h = ((hsl.h + deltaH) % 360 + 360) % 360;
  hsl.s = Math.max(8, Math.min(100, hsl.s + deltaS));
  hsl.l = Math.max(6, Math.min(94, hsl.l + deltaL));

  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function humanizeColorName(value: string): string {
  if (/[\s_-]+/.test(value)) {
    return value
      .trim()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  const normalized = normalizeColorNameKey(value);
  if (!normalized) return "Custom Color";

  const words: string[] = [];
  let remaining = normalized;

  while (remaining.length > 0) {
    const token = COLOR_NAME_TOKENS.find((candidate) =>
      remaining.startsWith(candidate)
    );
    if (!token) {
      words.push(remaining);
      break;
    }
    words.push(token);
    remaining = remaining.slice(token.length);
  }

  return words
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function getExactColorName(color: string): string | null {
  const hex = canonicalizeColor(color);
  if (!isHexColor(hex)) return null;
  const name = HEX_TO_PREFERRED_NAME.get(hex);
  return name ? humanizeColorName(name) : null;
}

export function getNearestColorName(color: string): {
  name: string;
  hex: string;
  distance: number;
} | null {
  const hex = canonicalizeColor(color);
  if (!isHexColor(hex)) return null;

  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const targetLab = rgbToLab(rgb);
  let best: NamedColorLab | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of NAMED_COLOR_LAB_ENTRIES) {
    const distance = deltaE76(targetLab, candidate.lab);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  if (!best) return null;

  return {
    name: humanizeColorName(best.name),
    hex: best.hex,
    distance: bestDistance,
  };
}

export function resolveColorMetadata(value: string): ColorMetadata {
  const namedHex = getNamedColorHex(value);
  if (namedHex) {
    const canonicalName = COLOR_NAME_LOOKUP.get(normalizeColorNameKey(value));
    return {
      colorCode: namedHex,
      colorName: canonicalName ? humanizeColorName(canonicalName) : humanizeColorName(value),
      source: "named",
      confidence: canonicalName ? 1 : 0.86,
    };
  }

  const canonical = canonicalizeColor(value);
  if (isHexColor(canonical)) {
    const exactName = getExactColorName(canonical);
    if (exactName) {
      return {
        colorCode: canonical,
        colorName: exactName,
        source: "exact",
        confidence: 1,
      };
    }

    const nearest = getNearestColorName(canonical);
    if (nearest) {
      const confidence = Math.max(0.45, 1 - nearest.distance / 40);
      return {
        colorCode: canonical,
        colorName: getDescriptiveShadeName(canonical, nearest.name),
        source: "nearest",
        confidence,
      };
    }
  }

  return {
    colorCode: canonical,
    colorName: "Custom Color",
    source: "custom",
    confidence: 0.4,
  };
}

function getDescriptiveShadeName(colorHex: string, baseName: string): string {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return baseName;

  const { s, l } = rgbToHsl(rgb);
  const tone = l > 82 ? "Pale" : l < 22 ? "Deep" : s < 20 ? "Muted" : s > 70 ? "Vivid" : "Soft";

  if (baseName.toLowerCase().includes(tone.toLowerCase())) {
    return baseName;
  }

  return `${tone} ${baseName}`;
}

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
    return normalizeColorFunction(trimmed);
  }
  if (trimmed.startsWith("oklab(")) {
    return normalizeColorFunction(trimmed);
  }
  if (trimmed.startsWith("lab(")) {
    return normalizeColorFunction(trimmed);
  }
  if (trimmed.startsWith("lch(")) {
    return normalizeColorFunction(trimmed);
  }
  if (trimmed.startsWith("color(")) {
    return normalizeColorFunction(trimmed);
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
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return rgbToHex(Number.parseInt(r), Number.parseInt(g), Number.parseInt(b));
  }

  // Handle hsl/hsla - convert to RGB then to hex
  const hslMatch = trimmed.match(
    /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/
  );
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    const rgb = hslToRgb(
      Number.parseInt(h),
      Number.parseInt(s),
      Number.parseInt(l)
    );
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // Handle named colors
  const namedHex = getNamedColorHex(trimmed);
  return namedHex || trimmed;
}

/**
 * Normalizes modern color function notation
 * Converts to consistent spacing and lowercase
 */
function normalizeColorFunction(color: string): string {
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

function hexToRgb(hex: string): RgbColor | null {
  if (!isHexColor(hex)) return null;
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function rgbToLab(rgb: RgbColor): LabColor {
  const srgbToLinear = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  const xr = x / 0.95047;
  const yr = y / 1.0;
  const zr = z / 1.08883;

  const f = (value: number): number =>
    value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function rgbToHsl(rgb: RgbColor): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}

function deltaE76(a: LabColor, b: LabColor): number {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(
  h: number,
  s: number,
  l: number
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
  type: "url" | "color" | "image" | "text"
): string {
  switch (type) {
    case "color":
      return canonicalizeColor(value);
    case "url":
      return canonicalizeUrl(value);
    case "image":
      // Images use their URL as-is for dedup
      return value.trim();
    case "text":
      // For text, just normalize whitespace and case
      return value.trim().toLowerCase();
    default:
      return value.trim().toLowerCase();
  }
}
