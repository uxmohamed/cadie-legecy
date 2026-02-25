import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateUUID } from "@/lib/validation/validate";

/**
 * GET /api/extension/link-context?linkId=<uuid>
 * Lightweight payload for extension overlay expansion.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const linkId = request.nextUrl.searchParams.get("linkId");
    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const uuidError = validateUUID(linkId, "linkId");
    if (uuidError) return uuidError;

    const identifier = getIdentifier(request, userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const supabase = await createClient();

    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", userId)
      .maybeSingle();

    if (linkError || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const [spacesResult, selectedResult] = await Promise.all([
      supabase
        .from("spaces")
        .select("id, name, color")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("link_spaces")
        .select("space_id")
        .eq("link_id", linkId),
    ]);

    if (spacesResult.error) {
      return NextResponse.json({ error: spacesResult.error.message }, { status: 500 });
    }

    if (selectedResult.error) {
      return NextResponse.json({ error: selectedResult.error.message }, { status: 500 });
    }

    const selectedSpaceIds = (selectedResult.data || []).map((row) => row.space_id);
    const allowedSpaceIds = new Set((spacesResult.data || []).map((space) => space.id));
    const filteredSelected = selectedSpaceIds.filter((spaceId) => allowedSpaceIds.has(spaceId));

    const response = NextResponse.json(
      {
        spaces: spacesResult.data || [],
        selected_space_ids: filteredSelected,
      },
      { headers: getRateLimitHeaders(limit, remaining, reset) }
    );

    response.headers.set("Cache-Control", "private, max-age=20, stale-while-revalidate=40");
    return response;
  } catch (error) {
    console.error("Error in GET /api/extension/link-context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
