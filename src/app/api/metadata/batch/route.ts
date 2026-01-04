import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMetadata } from "@/lib/metadata";
import type { ExtractedMetadata, BatchMetadataOptions, FetchStatus } from "@/features/links/types/link.types";
import { rateLimitMetadata, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";


/**
 * Maximum number of URLs per batch request
 * Prevents resource exhaustion and ensures reasonable response times
 */
const MAX_BATCH_SIZE = 50;

/**
 * Default options for batch metadata fetching
 */
const DEFAULT_OPTIONS: Required<BatchMetadataOptions> = {
    timeout: 5000,
    concurrency: 5,
    skipCache: false,
};

/**
 * POST /api/metadata/batch
 * 
 * Fetch metadata for multiple URLs in parallel with concurrency control.
 * 
 * Request body:
 * {
 *   urls: string[];
 *   options?: {
 *     timeout?: number;      // Per-URL timeout (default: 5000ms)
 *     concurrency?: number;  // Max parallel requests (default: 5)
 *   }
 * }
 * 
 * Response:
 * {
 *   results: {
 *     [url: string]: ExtractedMetadata | { error: string; fetch_status: FetchStatus }
 *   },
 *   summary: {
 *     total: number;
 *     success: number;
 *     failed: number;
 *   }
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Apply rate limiting to prevent abuse
        const identifier = getIdentifier(request, user.id);
        const { success, limit, reset, remaining } = await rateLimitMetadata.limit(identifier);
        
        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { 
                    status: 429,
                    headers: getRateLimitHeaders(limit, remaining, reset)
                }
            );
        }

    interface BatchMetadataBody {
      urls: string[];
      options?: BatchMetadataOptions;
    }

    const body = (await request.json()) as BatchMetadataBody;
    const { urls, options } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { error: "Invalid request: urls array required" },
                { status: 400 }
            );
        }

        // SECURITY: Enforce batch size limit to prevent resource exhaustion
        if (urls.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                { 
                    error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} URLs`,
                    maxBatchSize: MAX_BATCH_SIZE,
                    requestedSize: urls.length
                },
                { status: 400 }
            );
        }

        const opts = { ...DEFAULT_OPTIONS, ...options };
        
        // Limit concurrency to reasonable maximum
        opts.concurrency = Math.min(Math.max(1, opts.concurrency), 10);
        
        // Process URLs with concurrency control
        const results: Record<string, ExtractedMetadata | { error: string; fetch_status: FetchStatus }> = {};
        let success = 0;
        let failed = 0;

        // Process in batches
        for (let i = 0; i < urls.length; i += opts.concurrency) {
            const batch = urls.slice(i, i + opts.concurrency);
            
            const batchPromises = batch.map(async (url: string) => {
                try {
                    const metadata = await extractMetadata(url, opts.timeout);
                    results[url] = metadata;
                    if (metadata.fetch_status === "success") {
                        success++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                    results[url] = {
                        error: errorMessage,
                        fetch_status: "failed" as FetchStatus,
                    };
                    failed++;
                }
            });

            await Promise.all(batchPromises);
        }

        return NextResponse.json({
            results,
            summary: {
                total: urls.length,
                success,
                failed,
            },
        });
    } catch (error) {
        console.error("Error in POST /api/metadata/batch:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
