import { NextRequest, NextResponse } from "next/server";
import { verifySignatureEdge } from "@upstash/qstash/nextjs";
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
async function handler(request: NextRequest) {
  try {
    const job: EnrichMetadataJob = await request.json();
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
    await metadataService.enrichLink(linkId, url);
    
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

// Export with QStash signature verification
export const POST = verifySignatureEdge(handler);

export const runtime = "edge";
