import { NextResponse } from "next/server";
import { getBillingContext } from "@/lib/billing/context";
import { LIMIT_WARNING_THRESHOLD } from "@/lib/billing/entitlements";

export async function GET() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const context = await getBillingContext(user.id);
    const nearStarterLimit =
      context.plan === "starter" &&
      context.usage.totalSavedItems >= LIMIT_WARNING_THRESHOLD &&
      context.usage.totalSavedItems < (context.entitlements.maxSavedItems || 100);

    const effectiveSubscription =
      context.plan === "starter"
        ? {
            status: "inactive",
            interval: null,
            current_period_end: null,
            cancel_at_period_end: false,
            support_amount_cents: null,
          }
        : {
            status: context.billing?.subscription_status || "inactive",
            interval: context.billing?.billing_interval || null,
            current_period_end: context.billing?.current_period_end || null,
            cancel_at_period_end: context.billing?.cancel_at_period_end || false,
            support_amount_cents: context.billing?.support_amount_cents ?? null,
          };

    return NextResponse.json({
      plan: context.plan,
      subscription: effectiveSubscription,
      entitlements: context.entitlements,
      usage: context.usage,
      warnings: {
        near_starter_saved_items_limit: nearStarterLimit,
      },
      locked_space_ids: [...context.lockedSpaceIds],
      unlocked_space_ids: [...context.unlockedSpaceIds],
      believer_badge: context.plan === "believer",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load billing status",
      },
      { status: 500 }
    );
  }
}
