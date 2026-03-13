import { NextRequest, NextResponse } from "next/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { createRequestContext } from "@/lib/auth-middleware";
import { requireTokenScopes } from "@/lib/api-tokens";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";
import { RequestDataAccess, RequestDataAccessError } from "@/lib/request-data";

export async function GET(request: NextRequest) {
  try {
    const context = await createRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:read"]);
    if (scopeError) return scopeError;

    const dataAccess = new RequestDataAccess(context);

    // Rate limiting
    const identifier = getIdentifier(request, context.userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const liteMode = request.nextUrl.searchParams.get("lite") === "1";

    // Lightweight mode for extension/quick pickers: skip link_count aggregation.
    if (liteMode) {
      const liteSpaces = await dataAccess.listSpacesLite();
      const response = NextResponse.json({ spaces: liteSpaces || [] });
      response.headers.set(
        "Cache-Control",
        "private, max-age=60, stale-while-revalidate=120"
      );
      return response;
    }

    const spacesWithCounts = await dataAccess.listSpacesWithCounts();
    const response = NextResponse.json({ spaces: spacesWithCounts });
    response.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120"
    );
    return response;
  } catch (error) {
    if (error instanceof RequestDataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching spaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await createRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:write"]);
    if (scopeError) return scopeError;

    const dataAccess = new RequestDataAccess(context);

    // Rate limiting
    const identifier = getIdentifier(request, context.userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    interface CreateSpaceBody {
      name: string;
      color: string;
      sort_order?: number;
      description?: string;
    }

    const body = (await request.json()) as CreateSpaceBody;
    const { name, color, sort_order, description } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    // Enforce plan space limit
    const billingCtx = await getBillingContext(context.userId);
    if (billingCtx.entitlements.maxSpaces !== null && billingCtx.usage.spacesTotal >= billingCtx.entitlements.maxSpaces) {
      return createPlanLimitResponse({
        plan: billingCtx.plan,
        limitKey: "spaces",
        current: billingCtx.usage.spacesTotal,
        max: billingCtx.entitlements.maxSpaces,
        message: `You've reached the ${billingCtx.entitlements.maxSpaces}-space limit on the ${billingCtx.plan} plan. Upgrade to create more spaces.`,
      });
    }

    // Get max sort_order to append new space at the end
    const existingSpaces = await dataAccess.listSpacesWithCounts();
    const maxSortOrder = existingSpaces.reduce((currentMax, space) => {
      const sortOrder = typeof space.sort_order === "number" ? space.sort_order : -1;
      return Math.max(currentMax, sortOrder);
    }, -1);
    const newSortOrder = sort_order ?? maxSortOrder + 1;

    const normalizedDescription = typeof description === "string" ? description.trim().slice(0, 240) : null;
    const data = await dataAccess.createSpace({
      name,
      color,
      sortOrder: newSortOrder,
      description: normalizedDescription,
    });

    return NextResponse.json({ space: { ...data, link_count: 0 } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestDataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
