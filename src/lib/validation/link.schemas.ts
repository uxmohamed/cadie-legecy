import { z } from "zod";

/**
 * Schema for creating a new link
 */
export const createLinkSchema = z.object({
  url: z.string().url("Invalid URL format").max(2000, "URL too long"),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  content_type: z.enum(["url", "color"]).optional().default("url"),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  color_value: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional().nullable(),
  favicon_url: z.string().url("Invalid favicon URL").max(2000).optional().nullable(),
  og_image_url: z.string().url("Invalid image URL").max(2000).optional().nullable(),
  description: z.string().max(1000, "Description too long").optional().nullable(),
});

/**
 * Schema for updating a link
 */
export const updateLinkSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(500, "Title too long").optional(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  description: z.string().max(1000, "Description too long").optional().nullable(),
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
