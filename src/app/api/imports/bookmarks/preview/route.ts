import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";

const service = new BookmarkImportService();

/**
 * POST /api/imports/bookmarks/preview
 * Accepts bookmark HTML file and returns preview + draft job.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Bookmark file is required" }, { status: 400 });
    }

    const { job, preview } = await service.createPreviewDraft(user.id, file);
    return NextResponse.json({
      success: true,
      job,
      preview,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to preview bookmark import" },
      { status: 400 }
    );
  }
}

