import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";

const service = new BookmarkImportService();

/**
 * GET /api/imports?limit=20
 * Returns recent import jobs for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 20;
    const jobs = await service.listJobs(user.id, Number.isFinite(limit) ? limit : 20);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list import jobs" },
      { status: 500 }
    );
  }
}

