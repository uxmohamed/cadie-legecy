import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import { resolvePlanForUser } from "@/lib/billing/plan-resolver";
import { getEntitlements } from "@/lib/billing/entitlements";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";

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

    // Block Starter users from bookmark imports
    const { plan } = await resolvePlanForUser(user.id);
    const entitlements = getEntitlements(plan);
    if (!entitlements.bookmarkImportEnabled) {
      return createPlanLimitResponse({
        plan,
        limitKey: "imports",
        current: null,
        max: null,
        message: "Bookmark import is available on the Pro plan. Upgrade to import your bookmarks.",
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Bookmark file is required" }, { status: 400 });
    }

    const displayName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null;

    const { job, preview } = await service.createPreviewDraft(
      user.id,
      file,
      user.email ?? null,
      displayName
    );
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
