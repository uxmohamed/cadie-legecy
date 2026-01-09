import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";

export async function PATCH(
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

    // Rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    interface UpdateSpaceBody {
      name?: string;
      color?: string;
      sort_order?: number;
    }

    const body = (await request.json()) as UpdateSpaceBody;
    const { name, color, sort_order } = body;

    // Verify space belongs to user
    const { data: existingSpace, error: fetchError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: { name?: string; color?: string; sort_order?: number } = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from("spaces")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ space: data });
  } catch (error) {
    console.error("Error updating space:", error);
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

    const { id } = await params;

    // Rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    // Verify space belongs to user
    const { data: existingSpace, error: fetchError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Delete space (CASCADE will handle link_spaces)
    const { error } = await supabase
      .from("spaces")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
