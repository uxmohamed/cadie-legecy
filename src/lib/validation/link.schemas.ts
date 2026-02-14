import { z } from "zod";
import { isNamedColor } from "@/lib/canonicalize";

// Color validation patterns matching content-detector.ts
const HEX_COLOR_PATTERN = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const RGB_VALUE = "(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])";
const RGB_COLOR_PATTERN = new RegExp(
  `^rgb\\(${RGB_VALUE},\\s*${RGB_VALUE},\\s*${RGB_VALUE}\\)$`,
  "i"
);
const RGBA_COLOR_PATTERN = new RegExp(
  `^rgba\\(${RGB_VALUE},\\s*${RGB_VALUE},\\s*${RGB_VALUE},\\s*([\\d.]+)\\)$`,
  "i"
);
const HSL_COLOR_PATTERN = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i;
const HSLA_COLOR_PATTERN = /^hsla\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%,\s*([\d.]+)\)$/i;
const OKLCH_COLOR_PATTERN = /^oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;
const OKLAB_COLOR_PATTERN = /^oklab\(([\d.]+%?)\s+([\d.-]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;
const LAB_COLOR_PATTERN = /^lab\(([\d.]+%?)\s+([\d.-]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;
const LCH_COLOR_PATTERN = /^lch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/i;
const COLOR_FUNCTION_PATTERN = /^color\((srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i;

/**
 * Validates if a string is a valid color in any supported format
 */
function isValidColorValue(value: string): boolean {
  const trimmed = value.trim();
  
  if (HEX_COLOR_PATTERN.test(trimmed)) return true;
  if (RGB_COLOR_PATTERN.test(trimmed)) return true;
  if (RGBA_COLOR_PATTERN.test(trimmed)) return true;
  if (HSL_COLOR_PATTERN.test(trimmed)) return true;
  if (HSLA_COLOR_PATTERN.test(trimmed)) return true;
  if (OKLCH_COLOR_PATTERN.test(trimmed)) return true;
  if (OKLAB_COLOR_PATTERN.test(trimmed)) return true;
  if (LAB_COLOR_PATTERN.test(trimmed)) return true;
  if (LCH_COLOR_PATTERN.test(trimmed)) return true;
  if (COLOR_FUNCTION_PATTERN.test(trimmed)) return true;
  if (isNamedColor(trimmed)) return true;
  
  return false;
}

/**
 * Schema for creating a new link
 * Supports both URLs and colors as content types
 */
export const createLinkSchema = z.object({
  url: z.string().max(2000, "Value too long"),
  // Title is optional - if not provided, server uses domain as placeholder
  // and metadata enrichment will set the real title
  title: z.string().max(500, "Title too long").optional(),
  content_type: z.enum(["url", "color", "image"]).optional().default("url"),
  color_value: z.string().max(100, "Color value too long").optional().nullable(),
  favicon_url: z.string().url("Invalid favicon URL").max(2000).optional().nullable(),
  og_image_url: z.string().url("Invalid image URL").max(2000).optional().nullable(),
  description: z.string().max(1000, "Description too long").optional().nullable(),
}).refine(
  (data) => {
    // For color content type, validate that url/color_value is a valid color
    if (data.content_type === "color") {
      return isValidColorValue(data.url) || (data.color_value && isValidColorValue(data.color_value));
    }
    // For image content type, validate URL format
    if (data.content_type === "image") {
      try {
        new URL(data.url);
        return true;
      } catch {
        return false;
      }
    }
    // For URL content type, validate URL format
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid URL format or color value",
    path: ["url"],
  }
);

/**
 * Schema for updating a link
 */
export const updateLinkSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(500, "Title too long").optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  description: z.string().max(1000, "Description too long").optional().nullable(),
  notes: z.string().max(5000, "Notes too long").optional().nullable(),
  ai_tags: z.array(z.string().min(1).max(64)).max(20, "Too many tags").optional().nullable(),
});

/**
 * Schema for batch operations
 */
export const batchActionSchema = z.object({
  action: z.enum(["add", "delete", "restore", "permanent_delete", "pin", "unpin"]),
  ids: z.array(z.string().uuid("Invalid link ID")).optional(),
  links: z.array(createLinkSchema).optional(),
}).refine(
  (data) => {
    // 'add' requires links array, others require ids array
    if (data.action === "add") {
      return data.links && data.links.length > 0;
    }
    return data.ids && data.ids.length > 0;
  },
  {
    message: "Invalid request: 'add' action requires 'links' array, other actions require 'ids' array",
  }
);

/**
 * TypeScript types inferred from schemas
 */
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type BatchActionInput = z.infer<typeof batchActionSchema>;
