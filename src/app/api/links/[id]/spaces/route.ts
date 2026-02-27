import { NextRequest, NextResponse } from "next/server";
import { createDataClientForRequest } from "@/lib/supabase/server";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";
import { validateUUID } from "@/lib/validation/validate";

/**
 * GET /api/links/[id]/spaces
 * Get all spaces that a link belongs to
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: linkId } = await params;

    // UUID validation
    const uuidError = validateUUID(linkId, "Link ID");
    if (uuidError) return uuidError;

    // Use authenticateRequest to support both Bearer token (extension) and session auth (web)
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request, userId);
    const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const supabase = await createDataClientForRequest(request);

    // Verify link belongs to user
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 }
      );
    }

    // Get all spaces the link belongs to
    const { data: linkSpaces, error: linkSpacesError } = await supabase
      .from("link_spaces")
      .select("space_id")
      .eq("link_id", linkId);

    if (linkSpacesError) {
      return NextResponse.json(
        { error: linkSpacesError.message },
        { status: 500 }
      );
    }

    // Extract space IDs
    const spaceIds = (linkSpaces || []).map((ls) => ls.space_id);

    // Verify all spaces belong to user (security check)
    if (spaceIds.length > 0) {
      const { data: spaces, error: spacesError } = await supabase
        .from("spaces")
        .select("id")
        .eq("user_id", userId)
        .in("id", spaceIds);

      if (spacesError) {
        return NextResponse.json(
          { error: spacesError.message },
          { status: 500 }
        );
      }

      // Return only spaces that belong to user
      const userSpaceIds = new Set(spaces?.map((s) => s.id) || []);
      const filteredSpaceIds = spaceIds.filter((id) => userSpaceIds.has(id));

      return NextResponse.json(
        { space_ids: filteredSpaceIds },
        { headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    return NextResponse.json(
      { space_ids: [] },
      { headers: getRateLimitHeaders(limit, remaining, reset) }
    );
  } catch (error) {
    console.error("Error fetching link spaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
