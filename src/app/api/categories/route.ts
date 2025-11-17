import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get categories with link counts
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (categoriesError) {
      return NextResponse.json(
        { error: categoriesError.message },
        { status: 500 }
      );
    }

    // Get link counts for each category
    const { data: linkCounts, error: countsError } = await supabase
      .from("links")
      .select("category_id")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    if (countsError) {
      return NextResponse.json(
        { error: countsError.message },
        { status: 500 }
      );
    }

    // Count links per category
    const counts: Record<string, number> = {};
    linkCounts?.forEach((link) => {
      if (link.category_id) {
        counts[link.category_id] = (counts[link.category_id] || 0) + 1;
      }
    });

    // Add counts to categories
    const categoriesWithCounts = categories?.map((cat) => ({
      ...cat,
      count: counts[cat.id] || 0,
    }));

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error("Error fetching categories:", error);
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

    const body = await request.json();
    const { name, color, icon, description } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name,
        color,
        icon: icon || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

