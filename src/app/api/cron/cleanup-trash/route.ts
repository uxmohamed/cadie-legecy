import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";


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
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      log.warn("Unauthorized cron access attempt", { 
        ip: request.headers.get("x-forwarded-for") 
      });
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
