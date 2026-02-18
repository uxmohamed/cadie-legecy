import { NextResponse } from "next/server";
import { getCustomerPortalUrl } from "@/lib/billing/lemon-client";
import { getUserBillingRecord } from "@/lib/billing/plan-resolver";

export async function POST() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billing = await getUserBillingRecord(user.id);
    if (!billing?.lemon_subscription_id) {
      return NextResponse.json({ error: "No active subscription found for this account" }, { status: 400 });
    }

    const portal = await getCustomerPortalUrl(billing.lemon_subscription_id);

    return NextResponse.json({
      portal_url: portal.portalUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create billing portal session",
      },
      { status: 500 }
    );
  }
}
