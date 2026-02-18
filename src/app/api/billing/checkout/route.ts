import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout, getVariantIdForSelection } from "@/lib/billing/lemon-client";
import type { BillingInterval, PlanTier } from "@/lib/billing/types";

interface CheckoutBody {
  plan: PlanTier;
  interval?: BillingInterval;
  support_amount_cents?: number;
  return_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutBody;
    if (!body.plan || body.plan === "starter") {
      return NextResponse.json({ error: "A paid plan is required for checkout" }, { status: 400 });
    }

    const plan = body.plan;
    const interval: BillingInterval = plan === "believer" ? "year" : body.interval || "month";

    if (plan === "believer" && interval !== "year") {
      return NextResponse.json({ error: "Believer plan is yearly only" }, { status: 400 });
    }

    if (plan === "pro" && interval !== "month" && interval !== "year") {
      return NextResponse.json({ error: "Pro plan interval must be month or year" }, { status: 400 });
    }

    const supportAmountCents =
      typeof body.support_amount_cents === "number" && Number.isFinite(body.support_amount_cents)
        ? Math.max(0, Math.round(body.support_amount_cents))
        : null;

    const variantId = getVariantIdForSelection(plan, interval);
    const checkout = await createLemonCheckout({
      variantId,
      userId: user.id,
      email: user.email ?? null,
      supportAmountCents,
      checkoutReturnUrl: body.return_url || `${request.nextUrl.origin}/`,
    });

    return NextResponse.json({
      checkout_url: checkout.checkoutUrl,
      plan,
      interval,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create checkout",
      },
      { status: 500 }
    );
  }
}
