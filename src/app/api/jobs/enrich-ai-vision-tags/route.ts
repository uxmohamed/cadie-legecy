import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";
import { AITaggingService } from "@/features/links/services/ai-tagging.service";
import { log } from "@/lib/logger";
import type { EnrichAIVisionTagsJob } from "@/lib/job-queue";
import { updateLinkProcessingState } from "@/features/links/lib/link-processing";

/**
 * POST /api/jobs/enrich-ai-vision-tags
 *
 * Background job handler for AI vision-based tag generation for image items.
 * Called by QStash with automatic retries.
 */
export async function POST(request: NextRequest) {
  let job: EnrichAIVisionTagsJob | null = null;

  try {
    // Verify QStash signature
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const signature = request.headers.get("upstash-signature");
    const body = await request.text();

    if (!signature) {
      log.error("[AI Vision Tags Job] Missing QStash signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await receiver.verify({ signature, body });

    job = JSON.parse(body) as EnrichAIVisionTagsJob;
    const { linkId, userId } = job;

    if (!linkId || !userId) {
      log.error("[AI Vision Tags Job] Invalid job payload", { job });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    log.info("[AI Vision Tags Job] Processing", { linkId });

    // Use admin client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await updateLinkProcessingState(supabase, {
      linkId,
      userId,
      state: "processing",
      stage: "ai_vision_tagging",
    });

    // Fetch link data
    const { data: link, error: fetchError } = await supabase
      .from("links")
      .select("url, og_image_url, content_type, ai_tags")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !link) {
      log.error("[AI Vision Tags Job] Link not found", { linkId, error: fetchError });
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Only process image items
    if (link.content_type !== "image") {
      log.info("[AI Vision Tags Job] Skipping non-image item", { linkId });
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "completed",
        stage: "complete",
      });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Skip if already tagged
    if (link.ai_tags && link.ai_tags.length > 0) {
      log.info("[AI Vision Tags Job] Already tagged, skipping", { linkId });
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "completed",
        stage: "complete",
      });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Generate tags from image
    const taggingService = new AITaggingService();
    const result = await taggingService.generateTagsFromImage(
      link.og_image_url || link.url
    );

    if (!result) {
      log.warn("[AI Vision Tags Job] Tagging returned null", { linkId });
      await supabase
        .from("links")
        .update({
          fetch_status: "failed",
          fetched_at: new Date().toISOString(),
        })
        .eq("id", linkId)
        .eq("user_id", userId);
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "completed",
        stage: "complete",
      });
      return NextResponse.json({ success: true, noResult: true });
    }

    // Update link with tags and description
    const updateData: Record<string, unknown> = {
      ai_tags: result.tags,
      ai_key_themes: { category: result.category },
      fetch_status: "success",
      fetched_at: new Date().toISOString(),
    };

    if (result.description) {
      updateData.description = result.description;
    }
    if (result.title) {
      updateData.title = result.title;
    } else if (result.description) {
      updateData.title = result.description.split(/\s+/).slice(0, 5).join(" ");
    }

    const { error: updateError } = await supabase
      .from("links")
      .update(updateData)
      .eq("id", linkId)
      .eq("user_id", userId);

    if (updateError) {
      log.error("[AI Vision Tags Job] Failed to update link", {
        linkId,
        error: updateError,
      });
      return NextResponse.json(
        { error: "Failed to update link" },
        { status: 500 }
      );
    }
    await updateLinkProcessingState(supabase, {
      linkId,
      userId,
      state: "completed",
      stage: "complete",
    });

    log.info("[AI Vision Tags Job] Completed", {
      linkId,
      tags: result.tags,
      category: result.category,
      hasDescription: !!result.description,
    });

    return NextResponse.json({
      success: true,
      linkId,
      tags: result.tags,
      category: result.category,
    });
  } catch (error) {
    log.error("[AI Vision Tags Job] Failed", { error });
    if (job?.linkId && job.userId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await updateLinkProcessingState(supabase, {
          linkId: job.linkId,
          userId: job.userId,
          state: "completed",
          stage: "complete",
        });
      } catch {
        // Ignore follow-up persistence failures.
      }
    }
    return NextResponse.json(
      {
        error: "AI vision tagging failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
