import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import {
  getIdentifier,
  getRateLimitHeaders,
  rateLimitExports,
} from "@/lib/rate-limit";
import {
  createExportFilename,
  LinkExportService,
} from "@/features/exports/services/link-export.service";

const service = new LinkExportService();

/**
 * GET /api/exports/links/csv
 * Exports active links for the authenticated user as CSV.
 */
export async function GET(request: NextRequest) {
  const userId = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(request, userId);
  const { success, limit, reset, remaining } = await rateLimitExports.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: getRateLimitHeaders(limit, remaining, reset),
      }
    );
  }

  try {
    const filename = createExportFilename("active");
    const iterator = service.streamActiveLinksCsv(userId, "active");
    const firstChunk = await iterator.next();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (!firstChunk.done) {
            controller.enqueue(encoder.encode(firstChunk.value));
          }

          while (true) {
            const nextChunk = await iterator.next();
            if (nextChunk.done) break;
            controller.enqueue(encoder.encode(nextChunk.value));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        if (iterator.return) {
          await iterator.return(undefined as never);
        }
      },
    });

    const headers = {
      ...getRateLimitHeaders(limit, remaining, reset),
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    };

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to export links",
      },
      { status: 500 }
    );
  }
}
