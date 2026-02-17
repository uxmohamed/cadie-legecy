import { NextRequest, NextResponse } from "next/server";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import { log } from "@/lib/logger";

const service = new BookmarkImportService();

function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    result |= ca ^ cb;
  }
  return result === 0;
}

/**
 * GET /api/cron/cleanup-imports
 * Expires stale import drafts and removes stale import files from private storage.
 * Requires CRON_SECRET auth header.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || ""}`;

    if (!process.env.CRON_SECRET || !timingSafeEqual(authHeader, expectedAuth)) {
      log.warn("Unauthorized import cleanup cron access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await service.cleanupStaleJobs();

    log.info("Import cleanup completed", {
      expiredDrafts: result.expiredDrafts,
      removedFiles: result.removedFiles,
    });
    return NextResponse.json({
      success: true,
      ...result,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Import cleanup failed", { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Import cleanup failed",
      },
      { status: 500 }
    );
  }
}
