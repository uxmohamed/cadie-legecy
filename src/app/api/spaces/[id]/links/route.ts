import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: spaceId } = await params;

    // Rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    interface AddLinksBody {
      link_ids: string[];
    }

    const body = (await request.json()) as AddLinksBody;
    const { link_ids } = body;

    if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
      return NextResponse.json(
        { error: "link_ids array is required" },
        { status: 400 }
      );
    }

    // Verify space belongs to user
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", spaceId)
      .eq("user_id", user.id)
      .single();

    if (spaceError || !space) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Verify all links belong to user
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("id")
      .eq("user_id", user.id)
      .in("id", link_ids);

    if (linksError) {
      return NextResponse.json(
        { error: linksError.message },
        { status: 500 }
      );
    }

    if (!links || links.length !== link_ids.length) {
      return NextResponse.json(
        { error: "One or more links not found" },
        { status: 404 }
      );
    }

    // Insert link_spaces (ignore duplicates)
    const linkSpacesToInsert = link_ids.map(linkId => ({
      link_id: linkId,
      space_id: spaceId,
    }));

    const { data, error } = await supabase
      .from("link_spaces")
      .insert(linkSpacesToInsert)
      .select();

    if (error) {
      // Ignore unique constraint violations (link already in space)
      if (error.code === "23505") {
        return NextResponse.json({ 
          success: true,
          message: "Some links were already in this space"
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      link_spaces: data 
    });
  } catch (error) {
    console.error("Error adding links to space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { id: spaceId } = await params;

    // Rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    interface RemoveLinksBody {
      link_ids: string[];
    }

    const body = (await request.json()) as RemoveLinksBody;
    const { link_ids } = body;

    if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
      return NextResponse.json(
        { error: "link_ids array is required" },
        { status: 400 }
      );
    }

    // Verify space belongs to user
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", spaceId)
      .eq("user_id", user.id)
      .single();

    if (spaceError || !space) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Delete link_spaces
    const { error } = await supabase
      .from("link_spaces")
      .delete()
      .eq("space_id", spaceId)
      .in("link_id", link_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing links from space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
