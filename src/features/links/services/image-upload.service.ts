import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

/** Max file size: 20MB (pre-compression limit before optimization) */
export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;
/** Max files per single upload batch */
export const MAX_FILES_PER_UPLOAD = 1;
/** Max total images a user can store */
export const MAX_IMAGES_PER_USER = 100;
/** Target optimized file size for web delivery (~850KB) */
export const TARGET_OPTIMIZED_IMAGE_BYTES = 850 * 1024;
/** Absolute max raster dimension for optimized images */
export const MAX_OPTIMIZED_IMAGE_DIMENSION = 1920;

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

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function toMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function getPreferredOutputMimeTypes(inputType: string): string[] {
  if (inputType === "image/jpeg" || inputType === "image/png") {
    return ["image/avif", "image/webp", inputType];
  }
  return [inputType];
}

function getInitialQuality(inputType: string): number {
  if (inputType === "image/png") return 0.84;
  if (inputType === "image/jpeg") return 0.86;
  if (inputType === "image/webp") return 0.84;
  return 0.9;
}

function getOutputFileName(originalName: string, mimeType: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const ext = MIME_EXTENSION_MAP[mimeType] ?? "jpg";
  return `${baseName}.${ext}`;
}

function getFileExtensionFromMime(mimeType: string): string {
  return MIME_EXTENSION_MAP[mimeType] ?? "jpg";
}

async function compressPass(
  file: File,
  options: {
    targetBytes: number;
    maxDimension: number;
    initialQuality: number;
    outputType: string;
  }
): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: options.targetBytes / (1024 * 1024),
    maxWidthOrHeight: options.maxDimension,
    useWebWorker: true,
    preserveExif: false,
    fileType: options.outputType,
    initialQuality: options.initialQuality,
    maxIteration: 12,
  });

  return new File([compressed], getOutputFileName(file.name, compressed.type), {
    type: compressed.type,
    lastModified: file.lastModified,
  });
}

/**
 * Validate a file before upload.
 * Returns an error message or null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" has unsupported type. Allowed: JPEG, PNG, GIF, WebP, SVG, AVIF`;
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return `"${file.name}" is ${toMB(file.size)}MB. Maximum is ${toMB(MAX_IMAGE_FILE_SIZE)}MB`;
  }
  return null;
}

/**
 * Compress an image file for web.
 * Targets ~850KB / 1920px while preserving quality.
 * Skips SVGs and GIFs (already compact / animated).
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) {
    return file;
  }

  // Keep very small images as-is to avoid quality loss for negligible transfer gains.
  if (file.size <= 180 * 1024) {
    return file;
  }

  const outputTypes = getPreferredOutputMimeTypes(file.type);
  let firstPass: File | null = null;

  // Try preferred formats in order: AVIF -> WebP -> original.
  for (const outputType of outputTypes) {
    try {
      firstPass = await compressPass(file, {
        targetBytes: TARGET_OPTIMIZED_IMAGE_BYTES,
        maxDimension: MAX_OPTIMIZED_IMAGE_DIMENSION,
        initialQuality: getInitialQuality(file.type),
        outputType,
      });
      break;
    } catch {
      // Try next candidate format
    }
  }

  if (!firstPass) {
    return file;
  }

  let best = firstPass;

  // If still large, do a second pass tuned for delivery-first payload size.
  if (firstPass.size > TARGET_OPTIMIZED_IMAGE_BYTES) {
    try {
      const secondPass = await compressPass(firstPass, {
        targetBytes: Math.floor(TARGET_OPTIMIZED_IMAGE_BYTES * 0.78),
        maxDimension: 1600,
        initialQuality: 0.76,
        outputType: firstPass.type || file.type,
      });
      if (secondPass.size < best.size) {
        best = secondPass;
      }
    } catch {
      // Keep first pass if second pass fails.
    }
  }

  // Never replace with a larger file.
  if (best.size >= file.size) {
    return file;
  }

  return best;
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
    throw new Error(`Unable to verify image quota: ${error.message}`);
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
  const fileExt = getFileExtensionFromMime(optimized.type);
  const uniquePart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
  const fileName = `${userId}/${Date.now()}-${uniquePart}.${fileExt}`;

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
