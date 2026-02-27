import { NextRequest, NextResponse } from "next/server";
import { createDataClientForRequest } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";

function isMissingSpacesDescriptionColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return message.includes("'description' column of 'spaces'") || message.includes("column \"description\" of relation \"spaces\"");
}

export async function GET(request: NextRequest) {
  try {
    // Use authenticateRequest to support both Bearer token (extension) and session auth (web)
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request, userId);
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
      const supabase = await createDataClientForRequest(request);
      const { data: liteSpaces, error: liteError } = await supabase
        .from("spaces")
        .select("id, name, color")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });

      if (liteError) {
        return NextResponse.json(
          { error: liteError.message },
          { status: 500 }
        );
      }

      const response = NextResponse.json({ spaces: liteSpaces || [] });
      response.headers.set(
        "Cache-Control",
        "private, max-age=60, stale-while-revalidate=120"
      );
      return response;
    }

    // Get spaces and active link IDs in parallel
    const supabase = await createDataClientForRequest(request);
    const [spacesResult, activeLinksResult] = await Promise.all([
      supabase
        .from("spaces")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("links")
        .select("id")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .eq("is_archived", false),
    ]);

    if (spacesResult.error) {
      return NextResponse.json(
        { error: spacesResult.error.message },
        { status: 500 }
      );
    }

    const spaces = spacesResult.data;
    const spaceIds = spaces?.map(s => s.id) || [];

    if (spaceIds.length === 0 || !activeLinksResult.data) {
      const spacesWithCounts = spaces?.map((space) => ({
        ...space,
        link_count: 0,
      }));
      const response = NextResponse.json({ spaces: spacesWithCounts });
      response.headers.set(
        "Cache-Control",
        "private, max-age=60, stale-while-revalidate=120"
      );
      return response;
    }

    // Get link_spaces mappings for all spaces in a single query
    const activeLinkIds = new Set(activeLinksResult.data.map(l => l.id));
    const { data: linkSpaces } = await supabase
      .from("link_spaces")
      .select("space_id, link_id")
      .in("space_id", spaceIds);

    // Count active links per space
    const counts: Record<string, number> = {};
    linkSpaces?.forEach((linkSpace) => {
      if (activeLinkIds.has(linkSpace.link_id)) {
        counts[linkSpace.space_id] = (counts[linkSpace.space_id] || 0) + 1;
      }
    });

    // Add counts to spaces
    const spacesWithCounts = spaces?.map((space) => ({
      ...space,
      link_count: counts[space.id] || 0,
    }));

    const response = NextResponse.json({ spaces: spacesWithCounts });
    response.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120"
    );
    return response;
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use authenticateRequest to support both Bearer token (extension) and session auth (web)
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request, userId);
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
    const billingCtx = await getBillingContext(userId);
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
    const supabase = await createDataClientForRequest(request);
    const { data: existingSpaces } = await supabase
      .from("spaces")
      .select("sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxSortOrder = existingSpaces?.[0]?.sort_order ?? -1;
    const newSortOrder = sort_order ?? maxSortOrder + 1;

    const normalizedDescription = typeof description === "string" ? description.trim().slice(0, 240) : null;
    const insertPayload: {
      user_id: string;
      name: string;
      color: string;
      sort_order: number;
      description?: string | null;
    } = {
      user_id: userId,
      name,
      color,
      sort_order: newSortOrder,
    };

    if (normalizedDescription) {
      insertPayload.description = normalizedDescription;
    }

    let { data, error } = await supabase
      .from("spaces")
      .insert(insertPayload)
      .select()
      .single();

    if (error && insertPayload.description !== undefined && isMissingSpacesDescriptionColumn(error)) {
      ({ data, error } = await supabase
        .from("spaces")
        .insert({
          user_id: userId,
          name,
          color,
          sort_order: newSortOrder,
        })
        .select()
        .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ space: { ...data, description: data?.description ?? null, link_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error("Error creating space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
