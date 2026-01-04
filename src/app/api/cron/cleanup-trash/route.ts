import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";


/**
 * Timing-safe string comparison to prevent timing attacks
 * Uses constant-time comparison to avoid leaking information about the secret
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to maintain constant time
    // but we know it's going to fail
    const dummy = "x".repeat(a.length);
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ dummy.charCodeAt(i);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * GET /api/cron/cleanup-trash
 * Scheduled job to clean up expired trash items (deleted > 60 days ago)
 * 
 * This endpoint is called daily by Vercel Cron
 * Requires CRON_SECRET for authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization") || "";
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || ""}`;
    
    // SECURITY: Use timing-safe comparison to prevent timing attacks
    if (!process.env.CRON_SECRET || !timingSafeEqual(authHeader, expectedAuth)) {
      log.warn("Unauthorized cron access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Calculate cutoff date (60 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    
    log.info("Starting trash cleanup", { cutoffDate: cutoffDate.toISOString() });

    // Delete links that have been in trash for > 60 days
    const { data, error, count } = await supabase
      .from("links")
      .delete()
      .eq("is_deleted", true)
      .lt("deleted_at", cutoffDate.toISOString())
      .select("id");

    if (error) {
      log.error("Trash cleanup failed", { error });
      return NextResponse.json(
        { error: "Cleanup failed", details: error.message },
        { status: 500 }
      );
    }

    const cleanedCount = data?.length || 0;
    
    log.info("Trash cleanup completed", { 
      cleaned: cleanedCount,
      cutoffDate: cutoffDate.toISOString()
    });

    return NextResponse.json({
      success: true,
      cleaned: cleanedCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    log.error("Trash cleanup error", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
