import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";
import { AITaggingService } from "@/features/links/services/ai-tagging.service";
import { log } from "@/lib/logger";
import type { EnrichAITagsJob } from "@/lib/job-queue";

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
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || "PDF Document";
}

/**
 * POST /api/jobs/enrich-ai-tags
 *
 * Background job handler for AI tag generation.
 * Called by QStash with automatic retries.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const signature = request.headers.get("upstash-signature");
    const body = await request.text();

    if (!signature) {
      log.error("[AI Tags Job] Missing QStash signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await receiver.verify({ signature, body });

    const job: EnrichAITagsJob = JSON.parse(body);
    const { linkId, userId } = job;

    if (!linkId || !userId) {
      log.error("[AI Tags Job] Invalid job payload", { job });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    log.info("[AI Tags Job] Processing", { linkId });

    // Use admin client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch link data
    const { data: link, error: fetchError } = await supabase
      .from("links")
      .select("title, description, domain, site_name, url, content_type, ai_tags")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !link) {
      log.error("[AI Tags Job] Link not found", { linkId, error: fetchError });
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Skip color and image items (images use the dedicated vision job)
    if (link.content_type === "color" || link.content_type === "image") {
      log.info("[AI Tags Job] Skipping non-URL item", { linkId, contentType: link.content_type });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Skip if already tagged
    if (link.ai_tags && link.ai_tags.length > 0) {
      log.info("[AI Tags Job] Already tagged, skipping", { linkId });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Generate tags
    const taggingService = new AITaggingService();
    const isDocument = link.content_type === "document";
    const docLabel = isDocument ? deriveDocumentLabel(link.title, link.url) : null;

    const result = await taggingService.generateTags({
      title: isDocument ? docLabel : link.title,
      description: isDocument
        ? (link.description || "PDF document. Fast skim mode: metadata only, no deep content analysis.")
        : link.description,
      domain: link.domain,
      site_name: link.site_name,
      url: link.url,
      // Token-efficient by design: we never send full PDF text.
      content: null,
    });

    if (!result) {
      log.warn("[AI Tags Job] Tagging returned null", { linkId });
      return NextResponse.json({ success: true, noResult: true });
    }

    const updates: Record<string, unknown> = {
      ai_tags: result.tags,
      ai_key_themes: { category: result.category },
    };

    if (isDocument) {
      const normalizedTitle = normalizeDocTitle(docLabel || link.title || "PDF document");
      const hasGenericTitle = !link.title || link.title === link.url || link.title.toLowerCase() === "pdf document";
      if (hasGenericTitle) {
        updates.title = normalizedTitle;
      }

      if (!link.description || link.description.trim().length === 0) {
        updates.description = `PDF file saved as ${normalizedTitle}. Auto-tagged from filename and URL using low-token skim mode.`;
      }
    }

    // Update link with tags
    const { error: updateError } = await supabase
      .from("links")
      .update(updates)
      .eq("id", linkId)
      .eq("user_id", userId);

    if (updateError) {
      log.error("[AI Tags Job] Failed to update link", {
        linkId,
        error: updateError,
      });
      return NextResponse.json(
        { error: "Failed to update link" },
        { status: 500 }
      );
    }

    log.info("[AI Tags Job] Completed", {
      linkId,
      tags: result.tags,
      category: result.category,
    });

    return NextResponse.json({
      success: true,
      linkId,
      tags: result.tags,
      category: result.category,
    });
  } catch (error) {
    log.error("[AI Tags Job] Failed", { error });
    return NextResponse.json(
      {
        error: "AI tagging failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
