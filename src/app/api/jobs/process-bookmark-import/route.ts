import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import {
  buildBookmarkImportJobDedupeKey,
  QSTASH_JOB_MAX_ATTEMPTS,
  type ProcessBookmarkImportJob,
} from "@/lib/job-queue";
import {
  claimBackgroundJobExecution,
  getQStashAttemptInfo,
  markBackgroundJobCompleted,
  safeMarkBackgroundJobFailed,
} from "@/lib/background-job-executions";

const JOB_TYPE = "bookmark_import_processing";

const service = new BookmarkImportService();

/**
 * POST /api/jobs/process-bookmark-import
 * QStash worker endpoint for large bookmark imports.
 */
export async function POST(request: NextRequest) {
  let payload: ProcessBookmarkImportJob | null = null;
  let jobDedupeKey: string | null = null;
  let invocationId: string | null = null;
  let attemptCount = 1;

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

    payload = JSON.parse(body) as ProcessBookmarkImportJob;
    if (!payload.importJobId || !payload.userId) {
      return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
    }

    const attemptInfo = getQStashAttemptInfo(
      request.headers,
      QSTASH_JOB_MAX_ATTEMPTS.bookmarkImportProcessing
    );
    attemptCount = attemptInfo.attemptCount;
    jobDedupeKey = buildBookmarkImportJobDedupeKey(payload);

    const claimed = await claimBackgroundJobExecution({
      jobType: JOB_TYPE,
      dedupeKey: jobDedupeKey,
      payload: payload as unknown as Record<string, unknown>,
      attemptCount,
      maxAttempts: attemptInfo.maxAttempts,
    });
    invocationId = claimed.invocationId;

    if (!claimed.shouldProcess) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: claimed.duplicateState,
        importJobId: payload.importJobId,
      });
    }

    await service.processJob(payload.importJobId, payload.userId);
    await markBackgroundJobCompleted({
      jobType: JOB_TYPE,
      dedupeKey: jobDedupeKey,
      invocationId: invocationId!,
    });
    return NextResponse.json({
      success: true,
      importJobId: payload.importJobId,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (jobDedupeKey && invocationId) {
      const failure = await safeMarkBackgroundJobFailed({
        jobType: JOB_TYPE,
        dedupeKey: jobDedupeKey,
        invocationId,
        attemptCount,
        maxAttempts: QSTASH_JOB_MAX_ATTEMPTS.bookmarkImportProcessing,
        error,
      });
      if (failure.terminal) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Bookmark import processing failed permanently",
          },
          { status: 489 }
        );
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bookmark import processing failed",
      },
      { status: 500 }
    );
  }
}
