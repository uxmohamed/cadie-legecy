import { NextResponse } from "next/server";
import { getCustomerPortalUrl } from "@/lib/billing/lemon-client";
import { getUserBillingRecord } from "@/lib/billing/plan-resolver";
import { syncSubscription } from "@/lib/billing/sync";
import { log } from "@/lib/logger";
import { rateLimitBilling, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authUser = user;

    const identifier = getIdentifier(request, authUser.id);
    const { success, limit, remaining, reset } = await rateLimitBilling.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Too many billing requests. Please try again shortly." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    let syncAttempted = false;
    let syncReason: string | undefined;
    let billing = await getUserBillingRecord(authUser.id);

    async function syncAndReload() {
      const syncResult = await syncSubscription(authUser.id, authUser.email ?? null);
      syncAttempted = true;
      syncReason = syncResult.reason;
      billing = await getUserBillingRecord(authUser.id);
    }

    if (!billing?.lemon_subscription_id) {
      await syncAndReload();
      if (!billing?.lemon_subscription_id) {
        return NextResponse.json(
          {
            error: "No active Lemon subscription could be matched for this account",
            recoverable: true,
            sync_attempted: syncAttempted,
            reason: syncReason,
          },
          { status: 409 }
        );
      }
    }

    try {
      const portal = await getCustomerPortalUrl(billing.lemon_subscription_id);
      return NextResponse.json({
        portal_url: portal.portalUrl,
      });
    } catch {
      await syncAndReload();

      if (!billing?.lemon_subscription_id) {
        return NextResponse.json(
          {
            error: "No active Lemon subscription could be matched for this account",
            recoverable: true,
            sync_attempted: syncAttempted,
            reason: syncReason,
          },
          { status: 409 }
        );
      }

      const portal = await getCustomerPortalUrl(billing.lemon_subscription_id);
      return NextResponse.json({
        portal_url: portal.portalUrl,
      });
    }
  } catch (error) {
    log.error("[Billing] Failed to create portal session", error);
    return NextResponse.json(
      {
        error: "Failed to open billing portal. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
