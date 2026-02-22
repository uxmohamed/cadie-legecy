import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSubscription } from "@/lib/billing/sync";
import { rateLimitBilling, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identifier = getIdentifier(request, user.id);
    const { success, limit, remaining, reset } = await rateLimitBilling.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Too many billing requests. Please try again shortly." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
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
