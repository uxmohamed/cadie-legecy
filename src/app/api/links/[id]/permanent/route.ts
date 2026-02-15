import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitPermanentDelete, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateUUID } from "@/lib/validation/validate";


/**
 * DELETE /api/links/[id]/permanent
 * Permanently delete a link (hard delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // UUID validation
    const uuidError = validateUUID(id, "Link ID");
    if (uuidError) return uuidError;

    // Rate limiting for permanent deletion
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitPermanentDelete.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many deletion attempts. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    // Permanently delete the link (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error permanently deleting link:", error);
      return NextResponse.json(
        { error: "Failed to permanently delete link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/links/[id]/permanent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
