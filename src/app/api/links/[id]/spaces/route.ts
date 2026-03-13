import { NextRequest, NextResponse } from "next/server";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { createRequestContext } from "@/lib/auth-middleware";
import { requireTokenScopes } from "@/lib/api-tokens";
import { validateUUID } from "@/lib/validation/validate";
import { RequestDataAccess, RequestDataAccessError } from "@/lib/request-data";

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

    const context = await createRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:read"]);
    if (scopeError) return scopeError;

    const dataAccess = new RequestDataAccess(context);

    // Rate limiting
    const identifier = getIdentifier(request, context.userId);
    const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const spaceIds = await dataAccess.getLinkSpaceIds(linkId);
    return NextResponse.json(
      { space_ids: spaceIds },
      { headers: getRateLimitHeaders(limit, remaining, reset) }
    );
  } catch (error) {
    if (error instanceof RequestDataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching link spaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
