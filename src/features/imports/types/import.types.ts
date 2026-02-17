export type ImportJobStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

export interface BookmarkImportLink {
  url: string;
  title: string;
  topLevelFolder: string | null;
  folderPath: string[];
}

export interface BookmarkPreview {
  total_links: number;
  invalid_links: number;
  top_level_folders: string[];
  sample_links: BookmarkImportLink[];
}

export interface ImportCounters {
  processed_links: number;
  created_links: number;
  restored_links: number;
  duplicate_links: number;
  invalid_links: number;
  space_attached_existing_links: number;
}

export interface ImportJobDTO extends ImportCounters {
  id: string;
  user_id: string;
  status: ImportJobStatus;
  storage_path: string;
  original_filename: string;
  file_size_bytes: number;
  folder_mode: string | null;
  single_space_id: string | null;
  folder_to_space_map: Record<string, string> | null;
  fallback_space_id: string | null;
  preview_total_links: number;
  preview_invalid_links: number;
  preview_top_folders: string[];
  preview_sample_links: BookmarkImportLink[];
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessBookmarkImportJob {
  importJobId: string;
  userId: string;
}
