import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    // Get spaces with link counts
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (spacesError) {
      return NextResponse.json(
        { error: spacesError.message },
        { status: 500 }
      );
    }

    // Get link counts for each space
    const { data: linkSpaces, error: linkSpacesError } = await supabase
      .from("link_spaces")
      .select("space_id")
      .in("space_id", spaces?.map(s => s.id) || []);

    if (linkSpacesError) {
      return NextResponse.json(
        { error: linkSpacesError.message },
        { status: 500 }
      );
    }

    // Count links per space
    const counts: Record<string, number> = {};
    linkSpaces?.forEach((ls) => {
      counts[ls.space_id] = (counts[ls.space_id] || 0) + 1;
    });

    // Add counts to spaces
    const spacesWithCounts = spaces?.map((space) => ({
      ...space,
      link_count: counts[space.id] || 0,
    }));

    return NextResponse.json({ spaces: spacesWithCounts });
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request, user.id);
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
    const { data: existingSpaces } = await supabase
      .from("spaces")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxSortOrder = existingSpaces?.[0]?.sort_order ?? -1;
    const newSortOrder = sort_order ?? maxSortOrder + 1;

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        user_id: user.id,
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
