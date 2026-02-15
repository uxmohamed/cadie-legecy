import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";

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

    // Get spaces and active link IDs in parallel
    const supabase = await createClient();
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
    }

    const body = (await request.json()) as CreateSpaceBody;
    const { name, color, sort_order } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    // Get max sort_order to append new space at the end
    const supabase = await createClient();
    const { data: existingSpaces } = await supabase
      .from("spaces")
      .select("sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxSortOrder = existingSpaces?.[0]?.sort_order ?? -1;
    const newSortOrder = sort_order ?? maxSortOrder + 1;

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        user_id: userId,
        name,
        color,
        sort_order: newSortOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ space: { ...data, link_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error("Error creating space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
