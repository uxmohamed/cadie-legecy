import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSubscription } from "@/lib/billing/sync";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncSubscription(user.id, user.email ?? null);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to sync subscription",
      },
      { status: 500 }
    );
  }
}
