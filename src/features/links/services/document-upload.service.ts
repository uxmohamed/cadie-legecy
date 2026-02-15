import { createClient } from "@/lib/supabase/client";

/** Max file size: 25MB */
export const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024;
/** Max files per single upload batch */
export const MAX_DOCUMENTS_PER_UPLOAD = 1;
/** Max total documents a user can store */
export const MAX_DOCUMENTS_PER_USER = 200;

const ALLOWED_TYPES = ["application/pdf"];

export { ALLOWED_TYPES as ALLOWED_DOCUMENT_TYPES };

function toMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function getFileExtensionFromMime(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  return "bin";
}

/**
 * Validate a file before upload.
 * Returns an error message or null if valid.
 */
export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" has unsupported type. Allowed: PDF`;
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return `"${file.name}" is ${toMB(file.size)}MB. Maximum is ${toMB(MAX_DOCUMENT_FILE_SIZE)}MB`;
  }
  return null;
}

/**
 * Check how many documents the user currently has.
 */
export async function getUserDocumentCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("content_type", "document")
    .eq("is_deleted", false);

  if (error) {
    console.error("Failed to count user documents:", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Upload a PDF to Supabase Storage and return its public URL.
 * Files are scoped to the user's folder: documents/{userId}/{timestamp}.{ext}
 */
export async function uploadDocument(userId: string, file: File): Promise<string> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createClient();
  const fileExt = getFileExtensionFromMime(file.type);
  const uniquePart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
  const fileName = `${userId}/${Date.now()}-${uniquePart}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("documents")
    .upload(fileName, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
