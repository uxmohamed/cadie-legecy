import { NextRequest, NextResponse } from "next/server";
import { createRequestContext } from "@/lib/auth-middleware";
import { requireTokenScopes } from "@/lib/api-tokens";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateUUID } from "@/lib/validation/validate";
import { RequestDataAccess, RequestDataAccessError } from "@/lib/request-data";

/**
 * GET /api/extension/link-context?linkId=<uuid>
 * Lightweight payload for extension overlay expansion.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await createRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["extension:link-context:read"]);
    if (scopeError) return scopeError;

    const dataAccess = new RequestDataAccess(context);

    const linkId = request.nextUrl.searchParams.get("linkId");
    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const uuidError = validateUUID(linkId, "linkId");
    if (uuidError) return uuidError;

    const identifier = getIdentifier(request, context.userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const linkContext = await dataAccess.getLinkContext(linkId);

    const response = NextResponse.json(
      {
        spaces: linkContext.spaces,
        selected_space_ids: linkContext.selectedSpaceIds,
      },
      { headers: getRateLimitHeaders(limit, remaining, reset) }
    );

    response.headers.set("Cache-Control", "private, max-age=20, stale-while-revalidate=40");
    return response;
  } catch (error) {
    if (error instanceof RequestDataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error in GET /api/extension/link-context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
