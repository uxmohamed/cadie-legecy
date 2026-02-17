import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUUID } from "@/lib/validation/validate";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";

const service = new BookmarkImportService();

/**
 * GET /api/imports/[id]
 * Returns a single import job for the authenticated user.
 */
export async function GET(
  _request: NextRequest,
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

    const job = await service.getJob(user.id, id);
    if (!job) {
      return NextResponse.json({ error: "Import job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load import job" },
      { status: 500 }
    );
  }
}

