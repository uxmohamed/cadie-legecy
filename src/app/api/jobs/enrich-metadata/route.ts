import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { MetadataService } from "@/features/links/services/metadata.service";
import { log } from "@/lib/logger";
import type { EnrichMetadataJob } from "@/lib/job-queue";
import { createAdminClient } from "@/lib/supabase/server";
import { updateLinkProcessingState } from "@/features/links/lib/link-processing";


/**
 * POST /api/jobs/enrich-metadata
 * 
 * Background job handler for metadata enrichment
 * Called by QStash with automatic retries
 * 
 * This endpoint is secured by QStash signature verification
 */
export async function POST(request: NextRequest) {
  let job: EnrichMetadataJob | null = null;

  try {
    // Verify QStash signature
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const signature = request.headers.get("upstash-signature");
    const body = await request.text();

    if (!signature) {
      log.error("[Job] Missing QStash signature");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the signature
    await receiver.verify({
      signature,
      body,
    });

    // Parse the job
    job = JSON.parse(body) as EnrichMetadataJob;
    const { linkId, url, userId } = job;
    
    if (!linkId || !url || !userId) {
      log.error("[Job] Invalid metadata enrichment job", { job });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    log.info("[Job] Processing metadata enrichment", { linkId, url });

    const supabase = createAdminClient();
    await updateLinkProcessingState(supabase, {
      linkId,
      userId,
      state: "processing",
      stage: "metadata",
    });
    
    // Execute the metadata enrichment
    const metadataService = new MetadataService();
    const metadataStatus = await metadataService.enrichLink(linkId, url, "url", userId);
    if (metadataStatus === "success") {
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "processing",
        stage: "ai_tagging",
      });
    } else {
      log.warn("[Job] Metadata enrichment completed without full metadata", {
        linkId,
        metadataStatus,
      });
      await updateLinkProcessingState(supabase, {
        linkId,
        userId,
        state: "completed",
        stage: "complete",
      });
    }
    
    log.info("[Job] Metadata enrichment completed", { linkId });
    
    return NextResponse.json({ 
      success: true,
      linkId,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    log.error("[Job] Metadata enrichment failed", { error });
    if (job?.linkId && job.userId) {
      try {
        const supabase = createAdminClient();
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
    
    // Return 500 to trigger QStash retry
    return NextResponse.json(
      { 
        error: "Metadata enrichment failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
