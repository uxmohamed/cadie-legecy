import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Update each link's sort_order
        // We use Promise.all to run them in parallel, but for order guarantees
        // and to avoid race conditions, a transaction or serial updates might be safer.
        // However, Supabase/Postgres handles concurrent updates well enough for this scale.
        // For strict correctness, we could use a stored procedure, but this is fine for now.

        const updates = items.map((item: { id: string; sort_order: number }) =>
            supabase
                .from("links")
                .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
                .eq("id", item.id)
                .eq("user_id", user.id)
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering links:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
