import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

/** Max file size: 5MB (pre-compression limit for validation) */
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
/** Max files per single upload batch */
export const MAX_FILES_PER_UPLOAD = 1;
/** Max total images a user can store */
export const MAX_IMAGES_PER_USER = 100;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
];

export { ALLOWED_TYPES as ALLOWED_IMAGE_TYPES };

/** Types that can be compressed (raster formats). SVG/GIF are skipped. */
const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Validate a file before upload.
 * Returns an error message or null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" has unsupported type. Allowed: JPEG, PNG, GIF, WebP, SVG, AVIF`;
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name}" is ${sizeMB}MB. Maximum is 5MB`;
  }
  return null;
}

/**
 * Compress an image file for web.
 * Targets max 1MB / 2048px while preserving quality.
 * Skips SVGs and GIFs (already compact / animated).
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) {
    return file;
  }

  // Skip compression for files already under 200KB
  if (file.size <= 200 * 1024) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    preserveExif: false,
    fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
  });

  // Only use compressed version if it's actually smaller
  if (compressed.size >= file.size) {
    return file;
  }

  return new File([compressed], file.name, { type: compressed.type });
}

/**
 * Check how many images the user currently has.
 */
export async function getUserImageCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("content_type", "image")
    .eq("is_deleted", false);

  if (error) {
    console.error("Failed to count user images:", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Upload an image to Supabase Storage and return its public URL.
 * Compresses the image before upload for web optimization.
 * Files are scoped to the user's folder: images/{userId}/{timestamp}.{ext}
 */
export async function uploadImage(
  userId: string,
  file: File
): Promise<string> {
  // Validate file
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // Compress before uploading
  const optimized = await compressImage(file);

  const supabase = createClient();
  const fileExt = optimized.name.split(".").pop() || "jpg";
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, optimized, { cacheControl: "31536000", upsert: false });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
