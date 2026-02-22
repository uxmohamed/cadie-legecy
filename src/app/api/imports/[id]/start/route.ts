import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUUID } from "@/lib/validation/validate";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import { resolvePlanForUser } from "@/lib/billing/plan-resolver";
import { getEntitlements } from "@/lib/billing/entitlements";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";

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

    // Block Starter users from starting imports
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
