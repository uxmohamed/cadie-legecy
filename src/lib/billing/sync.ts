import { createAdminClient } from "@/lib/supabase/server";
import { resolvePlanFromVariantId, getUserBillingRecord } from "@/lib/billing/plan-resolver";
import { lemonRequest } from "@/lib/billing/lemon-client";
import { mapStatus, mapInterval, deriveBillingIntervalFromVariant } from "@/lib/billing/webhook-handler";
import { log } from "@/lib/logger";

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateString(value: unknown): string | null {
  const dateValue = asString(value);
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Syncs the local billing record with Lemon Squeezy API for a specific user.
 * - If user has a subscription_id, refreshes it.
 * - Updates local DB to match source of truth.
 */
export async function syncSubscription(userId: string): Promise<{ synced: boolean; message?: string }> {
  const billing = await getUserBillingRecord(userId);
  if (!billing || !billing.lemon_subscription_id) {
    return { synced: false, message: "No active subscription ID found locally" };
  }

  const subId = billing.lemon_subscription_id;

  try {
    // 1. Fetch Subscription from Lemon Squeezy
    const payload = await lemonRequest(`/subscriptions/${subId}`);
    const data = payload.data as Record<string, unknown> | undefined;
    
    if (!data) {
        throw new Error("No data returned from Lemon Squeezy");
    }

    const attributes = data.attributes as Record<string, unknown>;
    if (!attributes) {
        throw new Error("No attributes returned from Lemon Squeezy");
    }

    // 2. Map fields
    const variantId = asString(attributes.variant_id);
    const status = mapStatus(attributes.status, "sync"); // "sync" as event name to avoid overrides
    const billingInterval = mapInterval(attributes.billing_interval) || deriveBillingIntervalFromVariant(variantId);
    
    const currentPeriodEnd =
      parseDateString(attributes.renews_at) ||
      parseDateString(attributes.ends_at) ||
      parseDateString(attributes.trial_ends_at);

    const cancelAtPeriodEnd = 
        Boolean(attributes.cancel_at_period_end) || 
        Boolean(attributes.cancelled);

    const planTier = resolvePlanFromVariantId(variantId) || billing.plan_tier;

    // 3. Update DB
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      subscription_status: status,
      billing_interval: billingInterval,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: now,
      // We also update plan just in case it wasn't caught
      plan_tier: planTier,
      lemon_variant_id: variantId,
    };

    const { error } = await supabase
      .from("user_billing")
      .update(updatePayload)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    return { synced: true };
  } catch (err) {
    log.error(`[BillingSync] Failed to sync for user ${userId}`, err);
    return { 
        synced: false, 
        message: err instanceof Error ? err.message : "Unknown sync error" 
    };
  }
}
