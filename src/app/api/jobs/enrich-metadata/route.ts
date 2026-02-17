import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { MetadataService } from "@/features/links/services/metadata.service";
import { log } from "@/lib/logger";
import type { EnrichMetadataJob } from "@/lib/job-queue";


/**
 * POST /api/jobs/enrich-metadata
 * 
 * Background job handler for metadata enrichment
 * Called by QStash with automatic retries
 * 
 * This endpoint is secured by QStash signature verification
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
    const job: EnrichMetadataJob = JSON.parse(body);
    const { linkId, url, userId } = job;
    
    if (!linkId || !url || !userId) {
      log.error("[Job] Invalid metadata enrichment job", { job });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    log.info("[Job] Processing metadata enrichment", { linkId, url });
    
    // Execute the metadata enrichment
    const metadataService = new MetadataService();
    await metadataService.enrichLink(linkId, url, "url", userId);
    
    log.info("[Job] Metadata enrichment completed", { linkId });
    
    return NextResponse.json({ 
      success: true,
      linkId,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    log.error("[Job] Metadata enrichment failed", { error });
    
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
