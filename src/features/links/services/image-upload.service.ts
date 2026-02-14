import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
];

/**
 * Upload an image to Supabase Storage and return its public URL.
 * Files are scoped to the user's folder: images/{userId}/{timestamp}.{ext}
 */
export async function uploadImage(
  userId: string,
  file: File
): Promise<string> {
  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG, AVIF`
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 5MB`);
  }

  const supabase = createClient();
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, file, { cacheControl: "31536000", upsert: false });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
