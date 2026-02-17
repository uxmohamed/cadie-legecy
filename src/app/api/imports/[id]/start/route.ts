import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUUID } from "@/lib/validation/validate";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";

const service = new BookmarkImportService();

/**
 * POST /api/imports/[id]/start
 * Starts an import job in the background queue.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const uuidError = validateUUID(id, "Import job ID");
    if (uuidError) return uuidError;

    const job = await service.startJob(user.id, id, request.nextUrl.origin);
    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start import";
    const status = message.includes("queue is unavailable") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
