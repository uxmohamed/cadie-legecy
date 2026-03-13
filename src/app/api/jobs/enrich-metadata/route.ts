import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { MetadataService } from "@/features/links/services/metadata.service";
import { log } from "@/lib/logger";
import {
  buildMetadataJobDedupeKey,
  QSTASH_JOB_MAX_ATTEMPTS,
  type EnrichMetadataJob,
} from "@/lib/job-queue";
import { createAdminClient } from "@/lib/supabase/server";
import { updateLinkProcessingState } from "@/features/links/lib/link-processing";
import {
  claimBackgroundJobExecution,
  getQStashAttemptInfo,
  markBackgroundJobCompleted,
  safeMarkBackgroundJobFailed,
} from "@/lib/background-job-executions";

const JOB_TYPE = "metadata_enrichment";

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
  let jobDedupeKey: string | null = null;
  let invocationId: string | null = null;
  let attemptCount = 1;

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

    const attemptInfo = getQStashAttemptInfo(
      request.headers,
      QSTASH_JOB_MAX_ATTEMPTS.metadataEnrichment
    );
    attemptCount = attemptInfo.attemptCount;
    jobDedupeKey = buildMetadataJobDedupeKey(job);

    const claimed = await claimBackgroundJobExecution({
      jobType: JOB_TYPE,
      dedupeKey: jobDedupeKey,
      payload: job as unknown as Record<string, unknown>,
      attemptCount,
      maxAttempts: attemptInfo.maxAttempts,
    });
    invocationId = claimed.invocationId;

    if (!claimed.shouldProcess) {
      log.info("[Job] Skipping duplicate metadata delivery", {
        linkId,
        dedupeKey: jobDedupeKey,
        state: claimed.duplicateState,
        attemptCount,
        messageId: attemptInfo.messageId,
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: claimed.duplicateState,
        linkId,
      });
    }

    const supabase = createAdminClient();
    const { data: existingLink, error: existingLinkError } = await supabase
      .from("links")
      .select("fetch_status, ai_tags")
      .eq("id", linkId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLinkError) {
      throw new Error(existingLinkError.message);
    }

    const fetchStatus = existingLink?.fetch_status;
    const hasResolvedMetadata = Boolean(fetchStatus && fetchStatus !== "pending" && fetchStatus !== "fetching");
    if (hasResolvedMetadata) {
      if (fetchStatus === "success") {
        await updateLinkProcessingState(supabase, {
          linkId,
          userId,
          state: existingLink?.ai_tags?.length ? "completed" : "processing",
          stage: existingLink?.ai_tags?.length ? "complete" : "ai_tagging",
        });
      } else {
        await updateLinkProcessingState(supabase, {
          linkId,
          userId,
          state: "completed",
          stage: "complete",
        });
      }

      await markBackgroundJobCompleted({
        jobType: JOB_TYPE,
        dedupeKey: jobDedupeKey,
        invocationId: invocationId!,
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        linkId,
        reason: "already_resolved",
        fetchStatus,
      });
    }

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

    await markBackgroundJobCompleted({
      jobType: JOB_TYPE,
      dedupeKey: jobDedupeKey,
      invocationId: invocationId!,
    });
    
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

    if (jobDedupeKey && invocationId) {
      const failure = await safeMarkBackgroundJobFailed({
        jobType: JOB_TYPE,
        dedupeKey: jobDedupeKey,
        invocationId,
        attemptCount,
        maxAttempts: QSTASH_JOB_MAX_ATTEMPTS.metadataEnrichment,
        error,
      });
      if (failure.terminal) {
        return NextResponse.json(
          {
            error: "Metadata enrichment failed permanently",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 489 }
        );
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
