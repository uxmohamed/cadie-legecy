import { canonicalizeUrl } from "@/lib/canonicalize";
import { createAdminClient } from "@/lib/supabase/server";
import {
  enqueueBatchAITagging,
  enqueueBatchMetadataEnrichment,
  enqueueBookmarkImportProcessing,
} from "@/lib/job-queue";
import {
  parseBookmarkHtml,
  parseBookmarkHtmlDetailed,
} from "@/features/imports/parsers/bookmark-html.server";
import {
  getDeterministicSpaceColor,
  normalizeFolderMapKey,
  resolveDestinationSpaceId,
} from "@/features/imports/utils/folder-mapping";
import type {
  BookmarkImportLink,
  BookmarkPreview,
  FolderMode,
  ImportCounters,
  ImportJobDTO,
  ProcessBookmarkImportJob,
  StartImportRequest,
} from "@/features/imports/types/import.types";

const IMPORTS_BUCKET = "imports";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const DRAFT_EXPIRY_HOURS = 24;
const STALE_FILE_RETENTION_DAYS = 7;
const PROCESSING_CHUNK_SIZE = 300;
const MAX_LIST_LIMIT = 100;
const ALLOWED_EXTENSIONS = [".html", ".htm"];
const ALLOWED_MIME_TYPES = new Set(["text/html", "text/plain", "application/octet-stream", ""]);

interface LinkRowMinimal {
  id: string;
  url: string;
  clean_url: string;
  is_deleted: boolean;
  is_archived: boolean;
  content_type: string;
}

interface SpaceRowMinimal {
  id: string;
  name: string;
  sort_order: number;
}

interface ImportCleanupResult {
  expiredDrafts: number;
  removedFiles: number;
}

interface PreparedLink {
  url: string;
  cleanUrl: string;
  title: string;
  topLevelFolder: string | null;
  destinationSpaceId: string | null;
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function safeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120) || "bookmarks.html";
}

function normalizeFolderMap(input: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(input || {}).forEach(([folder, spaceId]) => {
    if (!spaceId) return;
    normalized[normalizeFolderMapKey(folder)] = spaceId;
  });
  return normalized;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function safeJobError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return "Unknown import processing error";
}

function normalizeImportJobRow(row: Record<string, unknown>): ImportJobDTO {
  const folderMapRaw = row.folder_to_space_map;
  const previewTopFoldersRaw = row.preview_top_folders;
  const previewSampleLinksRaw = row.preview_sample_links;

  const folderToSpaceMap =
    folderMapRaw && typeof folderMapRaw === "object" && !Array.isArray(folderMapRaw)
      ? (folderMapRaw as Record<string, string>)
      : null;
  const previewTopFolders = Array.isArray(previewTopFoldersRaw)
    ? previewTopFoldersRaw.filter((value): value is string => typeof value === "string")
    : [];
  const previewSampleLinks = Array.isArray(previewSampleLinksRaw)
    ? previewSampleLinksRaw.filter(
        (value): value is BookmarkImportLink =>
          typeof value === "object" &&
          value !== null &&
          typeof (value as BookmarkImportLink).url === "string" &&
          typeof (value as BookmarkImportLink).title === "string"
      )
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    status: row.status as ImportJobDTO["status"],
    storage_path: String(row.storage_path),
    original_filename: String(row.original_filename),
    file_size_bytes: Number(row.file_size_bytes || 0),
    folder_mode: (row.folder_mode as ImportJobDTO["folder_mode"]) || null,
    single_space_id: (row.single_space_id as string) || null,
    folder_to_space_map: folderToSpaceMap,
    fallback_space_id: (row.fallback_space_id as string) || null,
    preview_total_links: Number(row.preview_total_links || 0),
    preview_invalid_links: Number(row.preview_invalid_links || 0),
    preview_top_folders: previewTopFolders,
    preview_sample_links: previewSampleLinks,
    processed_links: Number(row.processed_links || 0),
    created_links: Number(row.created_links || 0),
    restored_links: Number(row.restored_links || 0),
    duplicate_links: Number(row.duplicate_links || 0),
    invalid_links: Number(row.invalid_links || 0),
    space_attached_existing_links: Number(row.space_attached_existing_links || 0),
    error_message: (row.error_message as string) || null,
    started_at: (row.started_at as string) || null,
    completed_at: (row.completed_at as string) || null,
    expires_at: String(row.expires_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function ensureQStashConfigured(): void {
  const required = [
    "QSTASH_TOKEN",
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
  ] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Background import queue is unavailable. Missing env vars: ${missing.join(", ")}`
    );
  }
}

export class BookmarkImportService {
  private getClient() {
    return createAdminClient();
  }

  private validateFile(file: File): void {
    if (!file) {
      throw new Error("Bookmark file is required");
    }

    if (file.size <= 0) {
      throw new Error("Bookmark file is empty");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("Bookmark file exceeds 50MB limit");
    }

    const lowerName = file.name.toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasAllowedExt) {
      throw new Error("Unsupported file type. Please upload an HTML bookmark export");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error("Unsupported file MIME type");
    }
  }

  async createPreviewDraft(userId: string, file: File): Promise<{ job: ImportJobDTO; preview: BookmarkPreview }> {
    this.validateFile(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString("utf-8");
    const preview = parseBookmarkHtml(content);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DRAFT_EXPIRY_HOURS * 60 * 60 * 1000);
    const jobId = crypto.randomUUID();
    const storagePath = `${userId}/${jobId}/${safeFileName(file.name)}`;

    const supabase = this.getClient();
    const { error: uploadError } = await supabase.storage
      .from(IMPORTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "text/html",
        cacheControl: "0",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload bookmark file: ${uploadError.message}`);
    }

    const { data, error } = await supabase
      .from("bookmark_import_jobs")
      .insert({
        id: jobId,
        user_id: userId,
        status: "draft",
        storage_path: storagePath,
        original_filename: file.name,
        file_size_bytes: file.size,
        preview_total_links: preview.total_links,
        preview_invalid_links: preview.invalid_links,
        preview_top_folders: preview.top_level_folders,
        preview_sample_links: preview.sample_links,
        processed_links: 0,
        created_links: 0,
        restored_links: 0,
        duplicate_links: 0,
        invalid_links: 0,
        space_attached_existing_links: 0,
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      await supabase.storage.from(IMPORTS_BUCKET).remove([storagePath]);
      throw new Error(`Failed to create import draft: ${error?.message || "Unknown error"}`);
    }

    return {
      job: normalizeImportJobRow(data as unknown as Record<string, unknown>),
      preview,
    };
  }

  async listJobs(userId: string, limit: number): Promise<ImportJobDTO[]> {
    const clampedLimit = Math.min(Math.max(limit || 20, 1), MAX_LIST_LIMIT);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("bookmark_import_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(clampedLimit);

    if (error) {
      throw new Error(`Failed to list imports: ${error.message}`);
    }

    return (data || []).map((row) => normalizeImportJobRow(row as unknown as Record<string, unknown>));
  }

  async getJob(userId: string, jobId: string): Promise<ImportJobDTO | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("bookmark_import_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load import job: ${error.message}`);
    }

    if (!data) return null;
    return normalizeImportJobRow(data as unknown as Record<string, unknown>);
  }

  private async validateStartRequest(
    userId: string,
    request: StartImportRequest
  ): Promise<{
    normalizedFolderMap: Record<string, string>;
    allowedSpaceIds: Set<string>;
  }> {
    const supabase = this.getClient();
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("id")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to validate destination spaces: ${error.message}`);
    }

    const allowedSpaceIds = new Set((spaces || []).map((space) => space.id));
    const normalizedFolderMap = normalizeFolderMap(request.folder_to_space_map || {});

    if (request.folder_mode === "single_space" && request.single_space_id) {
      if (!allowedSpaceIds.has(request.single_space_id)) {
        throw new Error("Selected destination space does not exist");
      }
    }

    if ((request.folder_mode === "manual_map" || request.folder_mode === "auto_create_spaces") && request.fallback_space_id) {
      if (!allowedSpaceIds.has(request.fallback_space_id)) {
        throw new Error("Fallback destination space does not exist");
      }
    }

    Object.values(normalizedFolderMap).forEach((spaceId) => {
      if (!allowedSpaceIds.has(spaceId)) {
        throw new Error("One or more mapped spaces do not exist");
      }
    });

    return {
      normalizedFolderMap,
      allowedSpaceIds,
    };
  }

  async startJob(
    userId: string,
    jobId: string,
    request: StartImportRequest,
    baseUrl: string
  ): Promise<ImportJobDTO> {
    ensureQStashConfigured();

    const current = await this.getJob(userId, jobId);
    if (!current) {
      throw new Error("Import job not found");
    }

    if (current.status !== "draft" && current.status !== "failed") {
      throw new Error("Import job is not ready to start");
    }

    if (new Date(current.expires_at).getTime() < Date.now()) {
      await this.getClient()
        .from("bookmark_import_jobs")
        .update({ status: "expired", error_message: "Import draft expired" })
        .eq("id", current.id)
        .eq("user_id", userId);
      throw new Error("Import preview expired. Upload the bookmark file again.");
    }

    const { normalizedFolderMap } = await this.validateStartRequest(userId, request);
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from("bookmark_import_jobs")
      .update({
        status: "queued",
        folder_mode: request.folder_mode,
        single_space_id: request.single_space_id,
        folder_to_space_map: normalizedFolderMap,
        fallback_space_id: request.fallback_space_id,
        processed_links: 0,
        created_links: 0,
        restored_links: 0,
        duplicate_links: 0,
        invalid_links: 0,
        space_attached_existing_links: 0,
        error_message: null,
        started_at: null,
        completed_at: null,
      })
      .eq("id", jobId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to start import job: ${error?.message || "Unknown error"}`);
    }

    const payload: ProcessBookmarkImportJob = {
      importJobId: jobId,
      userId,
    };

    try {
      await enqueueBookmarkImportProcessing(payload, { baseUrl });
    } catch (error) {
      await supabase
        .from("bookmark_import_jobs")
        .update({
          status: "failed",
          error_message: safeJobError(error),
        })
        .eq("id", jobId)
        .eq("user_id", userId);
      throw error;
    }

    return normalizeImportJobRow(data as unknown as Record<string, unknown>);
  }

  private async updateProgress(
    jobId: string,
    counters: ImportCounters & { processed_links: number }
  ): Promise<void> {
    const supabase = this.getClient();
    await supabase
      .from("bookmark_import_jobs")
      .update({
        processed_links: counters.processed_links,
        created_links: counters.created_links,
        restored_links: counters.restored_links,
        duplicate_links: counters.duplicate_links,
        invalid_links: counters.invalid_links,
        space_attached_existing_links: counters.space_attached_existing_links,
      })
      .eq("id", jobId);
  }

  private async ensureAutoCreatedSpaces(
    userId: string,
    topLevelFolders: string[]
  ): Promise<Map<string, string>> {
    const supabase = this.getClient();
    const { data: existingSpaces, error } = await supabase
      .from("spaces")
      .select("id, name, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to load spaces: ${error.message}`);
    }

    const byNormalizedName = new Map<string, SpaceRowMinimal>();
    let sortOrderSeed = 0;

    (existingSpaces || []).forEach((space) => {
      byNormalizedName.set(normalizeFolderMapKey(space.name), {
        id: space.id,
        name: space.name,
        sort_order: space.sort_order,
      });
      sortOrderSeed = Math.max(sortOrderSeed, Number(space.sort_order || 0));
    });

    for (const folderName of topLevelFolders) {
      const normalized = normalizeFolderMapKey(folderName);
      if (byNormalizedName.has(normalized)) continue;

      sortOrderSeed += 1;
      const { data: created, error: createError } = await supabase
        .from("spaces")
        .insert({
          user_id: userId,
          name: folderName,
          color: getDeterministicSpaceColor(folderName),
          sort_order: sortOrderSeed,
          description: null,
        })
        .select("id, name, sort_order")
        .single();

      if (createError || !created) {
        throw new Error(`Failed to auto-create space "${folderName}": ${createError?.message || "Unknown error"}`);
      }

      byNormalizedName.set(normalized, {
        id: created.id,
        name: created.name,
        sort_order: created.sort_order,
      });
    }

    const folderToSpace = new Map<string, string>();
    topLevelFolders.forEach((folderName) => {
      const normalized = normalizeFolderMapKey(folderName);
      const space = byNormalizedName.get(normalized);
      if (space) {
        folderToSpace.set(normalized, space.id);
      }
    });

    return folderToSpace;
  }

  async processJob(jobId: string, userId: string): Promise<void> {
    const supabase = this.getClient();
    const { data: rawJob, error: jobError } = await supabase
      .from("bookmark_import_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError || !rawJob) {
      throw new Error("Import job not found");
    }

    const job = normalizeImportJobRow(rawJob as unknown as Record<string, unknown>);
    if (job.status === "completed") {
      return;
    }

    if (job.status !== "queued" && job.status !== "processing" && job.status !== "failed") {
      throw new Error(`Import job cannot be processed from status "${job.status}"`);
    }

    await supabase
      .from("bookmark_import_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        processed_links: 0,
        created_links: 0,
        restored_links: 0,
        duplicate_links: 0,
        invalid_links: 0,
        space_attached_existing_links: 0,
      })
      .eq("id", job.id)
      .eq("user_id", userId);

    const counters: ImportCounters & { processed_links: number } = {
      processed_links: 0,
      created_links: 0,
      restored_links: 0,
      duplicate_links: 0,
      invalid_links: 0,
      space_attached_existing_links: 0,
    };

    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(IMPORTS_BUCKET)
        .download(job.storage_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download import file: ${downloadError?.message || "Unknown error"}`);
      }

      const content = await fileData.text();
      const parsed = parseBookmarkHtmlDetailed(content);
      counters.invalid_links = parsed.invalid_links;

      const normalizedFolderMap = normalizeFolderMap(job.folder_to_space_map || {});
      const autoCreatedFolderToSpaceMap =
        job.folder_mode === "auto_create_spaces"
          ? await this.ensureAutoCreatedSpaces(userId, parsed.top_level_folders)
          : new Map<string, string>();

      const validUniqueLinks: PreparedLink[] = [];
      const seen = new Set<string>();

      parsed.links.forEach((link) => {
        if (!isHttpUrl(link.url)) return;
        const cleanUrl = canonicalizeUrl(link.url);
        if (seen.has(cleanUrl)) return;
        seen.add(cleanUrl);

        const destinationSpaceId = resolveDestinationSpaceId({
          folderMode: (job.folder_mode || "single_space") as FolderMode,
          topLevelFolder: link.topLevelFolder,
          singleSpaceId: job.single_space_id,
          fallbackSpaceId: job.fallback_space_id,
          folderToSpaceMap: normalizedFolderMap,
          autoCreatedFolderToSpaceMap,
        });

        validUniqueLinks.push({
          url: link.url,
          cleanUrl,
          title: link.title,
          topLevelFolder: link.topLevelFolder,
          destinationSpaceId,
        });
      });

      for (let offset = 0; offset < validUniqueLinks.length; offset += PROCESSING_CHUNK_SIZE) {
        const chunk = validUniqueLinks.slice(offset, offset + PROCESSING_CHUNK_SIZE);
        counters.processed_links += chunk.length;

        const cleanUrls = chunk.map((item) => item.cleanUrl);
        const { data: existingRows, error: existingError } = await supabase
          .from("links")
          .select("id, url, clean_url, is_deleted, is_archived, content_type")
          .eq("user_id", userId)
          .in("clean_url", cleanUrls);

        if (existingError) {
          throw new Error(`Failed to check existing links: ${existingError.message}`);
        }

        const existingByClean = new Map<string, LinkRowMinimal>();
        (existingRows || []).forEach((row) => {
          existingByClean.set(row.clean_url, row as unknown as LinkRowMinimal);
        });

        const restoreIds: string[] = [];
        const restoreToSpace: Array<{ linkId: string; spaceId: string }> = [];
        const duplicateToSpace: Array<{ linkId: string; spaceId: string }> = [];
        const toInsert = chunk.filter((item) => {
          const existing = existingByClean.get(item.cleanUrl);
          if (!existing) return true;

          if (existing.is_deleted || existing.is_archived) {
            restoreIds.push(existing.id);
            counters.restored_links += 1;
            if (item.destinationSpaceId) {
              restoreToSpace.push({ linkId: existing.id, spaceId: item.destinationSpaceId });
            }
            return false;
          }

          counters.duplicate_links += 1;
          if (item.destinationSpaceId) {
            duplicateToSpace.push({ linkId: existing.id, spaceId: item.destinationSpaceId });
          }
          return false;
        });

        let restoredRows: Array<{ id: string; url: string; content_type: string | null }> = [];
        if (restoreIds.length > 0) {
          const { data: restoredData, error: restoreError } = await supabase
            .from("links")
            .update({
              is_deleted: false,
              is_archived: false,
              deleted_at: null,
            })
            .eq("user_id", userId)
            .in("id", restoreIds)
            .select("id, url, content_type");

          if (restoreError) {
            throw new Error(`Failed to restore links: ${restoreError.message}`);
          }

          restoredRows = (restoredData || []) as Array<{ id: string; url: string; content_type: string | null }>;
        }

        let insertedRows: Array<{ id: string; url: string; clean_url: string; content_type: string | null }> = [];
        if (toInsert.length > 0) {
          const insertPayload = toInsert.map((item) => ({
            user_id: userId,
            url: item.url,
            clean_url: item.cleanUrl,
            title: item.title || item.url,
            domain: extractDomain(item.url),
            content_type: "url",
            favicon_url: null,
            og_image_url: null,
            description: null,
            notes: null,
            content_text: null,
            is_pinned: false,
            is_archived: false,
            is_deleted: false,
            fetch_status: "pending",
            fetched_at: null,
          }));

          const { data: insertedData, error: insertError } = await supabase
            .from("links")
            .insert(insertPayload)
            .select("id, url, clean_url, content_type");

          if (insertError) {
            throw new Error(`Failed to create links during import: ${insertError.message}`);
          }

          insertedRows =
            (insertedData || []) as Array<{
              id: string;
              url: string;
              clean_url: string;
              content_type: string | null;
            }>;
          counters.created_links += insertedRows.length;
        }

        const insertByCleanUrl = new Map<string, string>();
        insertedRows.forEach((row) => {
          insertByCleanUrl.set(row.clean_url, row.id);
        });

        const insertToSpace: Array<{ linkId: string; spaceId: string }> = [];
        toInsert.forEach((item) => {
          if (!item.destinationSpaceId) return;
          const id = insertByCleanUrl.get(item.cleanUrl);
          if (!id) return;
          insertToSpace.push({ linkId: id, spaceId: item.destinationSpaceId });
        });

        const allSpaceTargets = [...duplicateToSpace, ...restoreToSpace, ...insertToSpace];
        const dedupSpaceTargets = new Map<string, { linkId: string; spaceId: string }>();
        allSpaceTargets.forEach((target) => {
          dedupSpaceTargets.set(`${target.linkId}:${target.spaceId}`, target);
        });

        if (dedupSpaceTargets.size > 0) {
          const targets = [...dedupSpaceTargets.values()];
          const linkIds = [...new Set(targets.map((target) => target.linkId))];
          const spaceIds = [...new Set(targets.map((target) => target.spaceId))];
          const { data: existingAssignments, error: assignmentQueryError } = await supabase
            .from("link_spaces")
            .select("link_id, space_id")
            .in("link_id", linkIds)
            .in("space_id", spaceIds);

          if (assignmentQueryError) {
            throw new Error(`Failed to load existing space assignments: ${assignmentQueryError.message}`);
          }

          const assigned = new Set(
            (existingAssignments || []).map((assignment) => `${assignment.link_id}:${assignment.space_id}`)
          );
          const toAssign = targets.filter((target) => !assigned.has(`${target.linkId}:${target.spaceId}`));

          if (toAssign.length > 0) {
            const { error: assignError } = await supabase
              .from("link_spaces")
              .insert(
                toAssign.map((target) => ({
                  link_id: target.linkId,
                  space_id: target.spaceId,
                }))
              );

            if (assignError && assignError.code !== "23505") {
              throw new Error(`Failed to attach imported links to spaces: ${assignError.message}`);
            }

            const duplicateTargetKeys = new Set(
              duplicateToSpace.map((target) => `${target.linkId}:${target.spaceId}`)
            );
            toAssign.forEach((target) => {
              if (duplicateTargetKeys.has(`${target.linkId}:${target.spaceId}`)) {
                counters.space_attached_existing_links += 1;
              }
            });
          }
        }

        const enrichable = [...insertedRows, ...restoredRows].filter(
          (row) => !row.content_type || row.content_type === "url"
        );

        if (enrichable.length > 0) {
          const metadataJobs = enrichable.map((row) => ({
            linkId: row.id,
            url: row.url,
            userId,
          }));
          const aiJobs = enrichable.map((row) => ({
            linkId: row.id,
            userId,
          }));

          await Promise.allSettled([
            enqueueBatchMetadataEnrichment(metadataJobs),
            enqueueBatchAITagging(aiJobs),
          ]);
        }

        await this.updateProgress(job.id, counters);
      }

      await supabase
        .from("bookmark_import_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          processed_links: counters.processed_links,
          created_links: counters.created_links,
          restored_links: counters.restored_links,
          duplicate_links: counters.duplicate_links,
          invalid_links: counters.invalid_links,
          space_attached_existing_links: counters.space_attached_existing_links,
          error_message: null,
        })
        .eq("id", job.id)
        .eq("user_id", userId);

      await supabase.storage.from(IMPORTS_BUCKET).remove([job.storage_path]);
    } catch (error) {
      await supabase
        .from("bookmark_import_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          processed_links: counters.processed_links,
          created_links: counters.created_links,
          restored_links: counters.restored_links,
          duplicate_links: counters.duplicate_links,
          invalid_links: counters.invalid_links,
          space_attached_existing_links: counters.space_attached_existing_links,
          error_message: safeJobError(error),
        })
        .eq("id", job.id)
        .eq("user_id", userId);

      throw error;
    }
  }

  async cleanupStaleJobs(): Promise<ImportCleanupResult> {
    const supabase = this.getClient();
    const nowIso = new Date().toISOString();
    const staleCutoff = new Date(Date.now() - STALE_FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    let removedFiles = 0;

    const { data: expiredDraftCandidates, error: expiredDraftQueryError } = await supabase
      .from("bookmark_import_jobs")
      .select("id, storage_path")
      .eq("status", "draft")
      .lt("expires_at", nowIso);

    if (expiredDraftQueryError) {
      throw new Error(`Failed to query expired import drafts: ${expiredDraftQueryError.message}`);
    }

    const expiredDrafts = expiredDraftCandidates || [];
    if (expiredDrafts.length > 0) {
      const expiredIds = expiredDrafts.map((row) => row.id);
      const { error: expiredUpdateError } = await supabase
        .from("bookmark_import_jobs")
        .update({
          status: "expired",
          error_message: "Import draft expired",
          completed_at: nowIso,
        })
        .in("id", expiredIds)
        .eq("status", "draft");

      if (expiredUpdateError) {
        throw new Error(`Failed to mark import drafts as expired: ${expiredUpdateError.message}`);
      }

      const expiredPaths = expiredDrafts
        .map((row) => row.storage_path)
        .filter((path): path is string => typeof path === "string" && path.length > 0);
      if (expiredPaths.length > 0) {
        const { data: deleted, error: deleteExpiredFilesError } = await supabase.storage
          .from(IMPORTS_BUCKET)
          .remove(expiredPaths);

        if (deleteExpiredFilesError) {
          throw new Error(`Failed to delete expired import files: ${deleteExpiredFilesError.message}`);
        }

        removedFiles += deleted?.length || 0;
      }
    }

    const { data: staleTerminalJobs, error: staleTerminalQueryError } = await supabase
      .from("bookmark_import_jobs")
      .select("storage_path")
      .in("status", ["failed", "completed", "expired"])
      .lt("created_at", staleCutoff);

    if (staleTerminalQueryError) {
      throw new Error(`Failed to query stale import files: ${staleTerminalQueryError.message}`);
    }

    const stalePaths = (staleTerminalJobs || [])
      .map((row) => row.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    if (stalePaths.length > 0) {
      const { data: deleted, error: deleteStaleFilesError } = await supabase.storage
        .from(IMPORTS_BUCKET)
        .remove(stalePaths);

      if (deleteStaleFilesError) {
        throw new Error(`Failed to delete stale import files: ${deleteStaleFilesError.message}`);
      }

      removedFiles += deleted?.length || 0;
    }

    return {
      expiredDrafts: expiredDrafts.length,
      removedFiles,
    };
  }
}
