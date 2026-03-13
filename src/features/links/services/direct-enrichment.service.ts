import { createAdminClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { updateLinkProcessingState } from "@/features/links/lib/link-processing";
import { shouldSkipAITagWrite } from "@/features/links/lib/enrichment-ownership";
import { MetadataService } from "@/features/links/services/metadata.service";
import { AITaggingService } from "@/features/links/services/ai-tagging.service";

const DIRECT_SELECT_FIELDS = [
  "id",
  "user_id",
  "url",
  "title",
  "description",
  "domain",
  "site_name",
  "content_text",
  "content_type",
  "og_image_url",
  "ai_tags",
  "fetch_status",
].join(", ");

type DirectEnrichmentLink = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  domain: string | null;
  site_name: string | null;
  content_text: string | null;
  content_type: string | null;
  og_image_url: string | null;
  ai_tags: string[] | null;
  fetch_status: string | null;
};

function deriveDocumentLabel(title: string | null, url: string): string {
  if (title && title.trim().length > 0) return title.trim();

  try {
    const parsed = new URL(url);
    const file = decodeURIComponent(parsed.pathname.split("/").pop() || "");
    const stripped = file.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
    return stripped || "PDF document";
  } catch {
    return "PDF document";
  }
}

function normalizeDocTitle(raw: string): string {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ") || "PDF Document";
}

async function loadLink(linkId: string, userId: string): Promise<DirectEnrichmentLink | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("links")
    .select(DIRECT_SELECT_FIELDS)
    .eq("id", linkId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    log.warn("[DirectEnrichment] Failed to load link", {
      linkId,
      userId,
      error: error.message,
    });
    return null;
  }

  return (data as DirectEnrichmentLink | null) ?? null;
}

async function updateUrlOrDocumentTags(link: DirectEnrichmentLink): Promise<void> {
  if (shouldSkipAITagWrite(link.ai_tags)) {
    return;
  }

  const supabase = createAdminClient();
  const taggingService = new AITaggingService();
  const isDocument = link.content_type === "document";
  const documentLabel = isDocument ? deriveDocumentLabel(link.title, link.url) : null;
  const result = await taggingService.generateTags({
    title: isDocument ? documentLabel : (link.title || link.url),
    description: isDocument
      ? (link.description || "PDF document. Fast skim mode: metadata only, no deep content analysis.")
      : link.description,
    domain: link.domain,
    site_name: link.site_name,
    url: link.url,
    content: isDocument ? null : link.content_text,
  });

  if (!result) {
    return;
  }

  const updates: Record<string, unknown> = {
    ai_tags: result.tags,
    ai_key_themes: { category: result.category },
  };

  if (isDocument) {
    const normalizedTitle = normalizeDocTitle(documentLabel || link.title || "PDF document");
    const hasGenericTitle = !link.title || link.title === link.url || link.title.toLowerCase() === "pdf document";
    if (hasGenericTitle) {
      updates.title = normalizedTitle;
    }
    if (!link.description || link.description.trim().length === 0) {
      updates.description = `PDF file saved as ${normalizedTitle}. Auto-tagged from filename and URL using low-token skim mode.`;
    }
    updates.fetch_status = "success";
    updates.fetched_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("links")
    .update(updates)
    .eq("id", link.id)
    .eq("user_id", link.user_id);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateImageTags(link: DirectEnrichmentLink): Promise<void> {
  if (shouldSkipAITagWrite(link.ai_tags)) {
    return;
  }

  const supabase = createAdminClient();
  const taggingService = new AITaggingService();
  const result = await taggingService.generateTagsFromImage(link.og_image_url || link.url);

  if (!result) {
    return;
  }

  const updates: Record<string, unknown> = {
    ai_tags: result.tags,
    ai_key_themes: { category: result.category },
    fetch_status: "success",
    fetched_at: new Date().toISOString(),
  };

  if (result.description) {
    updates.description = result.description;
  }
  if (result.title) {
    updates.title = result.title;
  } else if (result.description) {
    updates.title = result.description.split(/\s+/).slice(0, 5).join(" ");
  }

  const { error } = await supabase
    .from("links")
    .update(updates)
    .eq("id", link.id)
    .eq("user_id", link.user_id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function runDirectLinkEnrichment(linkId: string, userId: string): Promise<void> {
  const metadataService = new MetadataService();
  const supabase = createAdminClient();

  try {
    let link = await loadLink(linkId, userId);
    if (!link) return;

    if (link.content_type === "url" && (link.fetch_status === "pending" || link.fetch_status === "fetching")) {
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "processing",
        stage: "metadata",
      });
      await metadataService.enrichLink(linkId, link.url, "url", userId);
      link = await loadLink(linkId, userId);
      if (!link) return;
    }

    if (link.content_type === "image") {
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "processing",
        stage: "ai_vision_tagging",
      });
      await updateImageTags(link);
    } else if (link.content_type === "url" || link.content_type === "document") {
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "processing",
        stage: "ai_tagging",
      });
      await updateUrlOrDocumentTags(link);
    }
  } catch (error) {
    log.warn("[DirectEnrichment] Falling back ended with an error", {
      linkId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    const current = await loadLink(linkId, userId);
    if (current?.content_type === "url" && (current.fetch_status === "pending" || current.fetch_status === "fetching")) {
      await supabase
        .from("links")
        .update({
          fetch_status: "failed",
          fetched_at: new Date().toISOString(),
        })
        .eq("id", linkId)
        .eq("user_id", userId);
    }
  } finally {
    try {
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "completed",
        stage: "complete",
      });
    } catch (error) {
      log.warn("[DirectEnrichment] Failed to persist completion state", {
        linkId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
