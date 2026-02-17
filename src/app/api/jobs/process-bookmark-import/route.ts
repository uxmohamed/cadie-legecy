import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import type { ProcessBookmarkImportJob } from "@/features/imports/types/import.types";

const service = new BookmarkImportService();

/**
 * POST /api/jobs/process-bookmark-import
 * QStash worker endpoint for large bookmark imports.
 */
export async function POST(request: NextRequest) {
  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const signature = request.headers.get("upstash-signature");
    const body = await request.text();

    if (!signature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await receiver.verify({ signature, body });

    const payload = JSON.parse(body) as ProcessBookmarkImportJob;
    if (!payload.importJobId || !payload.userId) {
      return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
    }

    await service.processJob(payload.importJobId, payload.userId);
    return NextResponse.json({
      success: true,
      importJobId: payload.importJobId,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bookmark import processing failed",
      },
      { status: 500 }
    );
  }
}

