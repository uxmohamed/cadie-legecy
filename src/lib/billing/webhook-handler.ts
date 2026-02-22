import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { resolvePlanFromVariantId } from "@/lib/billing/plan-resolver";
import type { BillingInterval, PlanTier, SubscriptionStatus } from "@/lib/billing/types";
import { log } from "@/lib/logger";

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
  };
}

interface ProcessWebhookResult {
  processed: boolean;
  ignored?: boolean;
}

interface ExistingBillingLookup {
  user_id: string;
  plan_tier: PlanTier;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Coerce numbers and strings to trimmed string, return null for anything else. */
function coerceString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function parseDateString(value: unknown): string | null {
  const dateValue = asString(value);
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}

export function verifyLemonWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const normalizedSignature = signature.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalizedSignature)) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "hex");
  const received = Buffer.from(normalizedSignature, "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

async function lookupUserIdByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const targetEmail = email.toLowerCase();
  const perPage = 200;

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) {
      return null;
    }

    const match = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail);
    if (match) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  return null;
}

function deriveEventId(payload: LemonWebhookPayload, rawBody: string): string {
  const eventName = asString(payload.meta?.event_name) || "unknown";
  const subscriptionId = coerceString(payload.data?.id) || "unknown";
  const bodyHash = createHash("sha256").update(rawBody).digest("hex").slice(0, 16);

  return `${eventName}:${subscriptionId}:${bodyHash}`;
}

export function mapStatus(rawStatus: unknown, eventName: string): SubscriptionStatus {
  const status = String(rawStatus || "").toLowerCase();

  // Explicit event overrides
  if (eventName === "subscription_expired") return "expired";
  if (eventName === "subscription_payment_failed") return "past_due";
  // For cancellation, we only set the status to 'canceled' if the subscription is actually canceled right now,
  // but usually it is 'active' with 'cancel_at_period_end' set to true.
  // However, if the event is 'subscription_cancelled', LemonSqueezy might mean "cancelled immediately".
  // We'll rely on the status from the payload mostly, but specific events can signal state changes.

  if (status === "active" || status === "on_trial") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "cancelled" || status === "canceled") return "canceled";
  if (status === "expired") return "expired";

  return "inactive";
}

export function mapInterval(rawInterval: unknown): BillingInterval {
  if (rawInterval == null) return null;
  const value = String(rawInterval).toLowerCase();
  if (value === "month" || value === "monthly") return "month";
  if (value === "year" || value === "yearly" || value === "annually") return "year";
  return null;
}

export function deriveBillingIntervalFromVariant(variantId: string | null): BillingInterval {
  if (!variantId) return null;
  const plan = resolvePlanFromVariantId(variantId);
  if (!plan) return null;

  const proMonthly = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
  if (proMonthly && variantId === proMonthly) return "month";
  // Pro yearly and Believer yearly are both "year"
  return "year";
}

async function lookupBillingByLemonIds(customerId: string | null, subscriptionId: string | null): Promise<ExistingBillingLookup | null> {
  const supabase = createAdminClient();

  if (subscriptionId) {
    const { data } = await supabase
      .from("user_billing")
      .select("user_id, plan_tier")
      .eq("lemon_subscription_id", subscriptionId)
      .maybeSingle();

    if (data) {
      return {
        user_id: String(data.user_id),
        plan_tier: data.plan_tier as PlanTier,
      };
    }
  }

  if (customerId) {
    const { data } = await supabase
      .from("user_billing")
      .select("user_id, plan_tier")
      .eq("lemon_customer_id", customerId)
      .maybeSingle();

    if (data) {
      return {
        user_id: String(data.user_id),
        plan_tier: data.plan_tier as PlanTier,
      };
    }
  }

  return null;
}

// Exported for testing or future use
export async function lookupUserByEmail(email: string | null): Promise<string | null> {
  if (!email) return null;
  // Note: Unused for now but kept for future reference or if auth.admin needs to be used
  return null; 
}

function extractSupportAmountCents(attributes: Record<string, unknown>): number | null {
  const candidates = [
    attributes.support_amount_cents,
    attributes.total_cents,
    attributes.subtotal,
    attributes.subtotal_cents,
    attributes.unit_price,
  ];

  for (const value of candidates) {
    const parsed = parseInteger(value);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

export async function processLemonWebhook(rawBody: string): Promise<ProcessWebhookResult> {
  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const eventName = asString(payload.meta?.event_name) || "unknown";
  
  // Helper to extract attributes safely
  const attributes = (payload.data?.attributes || {}) as Record<string, unknown>;
  const customData = payload.meta?.custom_data || {};
  
  // 1. Deduplication using Event ID
  const eventId = deriveEventId(payload, rawBody);
  const supabase = createAdminClient();

  const eventInsert = await supabase
    .from("billing_webhook_events")
    .insert({
      event_id: eventId,
      event_name: eventName,
      payload,
    })
    .select("id")
    .single();

  if (eventInsert.error && eventInsert.error.code === "23505") { // Unique violation
    return { processed: true, ignored: true };
  }

  if (eventInsert.error) {
    throw new Error(`Failed to persist webhook event: ${eventInsert.error.message}`);
  }

  // 2. Identify User
  const customerId = coerceString(attributes.customer_id) || coerceString(attributes.customer);
  const subscriptionId = coerceString(payload.data?.id) || coerceString(attributes.subscription_id);
  const explicitUserId = coerceString(customData.user_id) || coerceString(attributes.user_id);
  const userEmail = coerceString(attributes.user_email) || coerceString(attributes.email);

  let userId = explicitUserId;
  let existingBilling: ExistingBillingLookup | null = null;

  if (!userId) {
    existingBilling = await lookupBillingByLemonIds(customerId, subscriptionId);
    userId = existingBilling?.user_id || null;
  }

  // Safety net: look up by email if we still don't have a userId and we have an email
  if (!userId && userEmail) {
    userId = await lookupUserIdByEmail(supabase, userEmail);
  }

  if (!userId) {
    // If we can't match a user, we can't process the billing update.
    log.warn(`[Billing] Could not identify user for event ${eventId} (customer: ${customerId}, sub: ${subscriptionId})`);
    return { processed: true, ignored: true };
  }

  // 3. Process Logic based on Event Name
  // Common data extraction
  // attributes.variant_id is standard for subscription events.
  // attributes.first_order_item.variant_id is standard for order events (like Lifetime deals).
  const variantId =
    coerceString(attributes.variant_id) ||
    coerceString((attributes.first_order_item as Record<string, unknown>)?.variant_id);

  const mappedPlan = resolvePlanFromVariantId(variantId);
  const hasMappedPaidPlan = mappedPlan === "pro" || mappedPlan === "believer";
  
  // Default parsing for subscription dates/status
  // Note: some events might not have all attributes, so we default carefully.
  const rawStatus = attributes.status;
  const status = mapStatus(rawStatus, eventName);
  const billingInterval = mapInterval(attributes.billing_interval || attributes.interval) || deriveBillingIntervalFromVariant(variantId);
  
  const currentPeriodEnd =
    parseDateString(attributes.renews_at) ||
    parseDateString(attributes.ends_at) ||
    parseDateString(attributes.trial_ends_at);

  const cancelAtPeriodEnd =
    Boolean(attributes.cancel_at_period_end) ||
    Boolean(attributes.cancelled) ||
    eventName === "subscription_cancelled"; // Explicit event check

  const supportAmountCents = extractSupportAmountCents(attributes);

  const now = new Date().toISOString();
  
  // Construct the payload for DB update
  // We only update fields that are safely derivable.
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    last_webhook_event_at: now,
    updated_at: now,
  };

  // Logic switch
  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused":
      // Fail closed: never activate paid access unless variant is explicitly mapped.
      if (!hasMappedPaidPlan) {
        log.warn(`[Billing] Ignoring ${eventName} with unmapped variant for user ${userId}`, {
          variantId,
          subscriptionId,
        });
        return { processed: true, ignored: true };
      }
      upsertPayload.plan_tier = mappedPlan;
      upsertPayload.subscription_status = status;
      upsertPayload.billing_interval = billingInterval;
      upsertPayload.lemon_customer_id = customerId;
      upsertPayload.lemon_subscription_id = subscriptionId;
      upsertPayload.lemon_variant_id = variantId;
      upsertPayload.current_period_end = currentPeriodEnd;
      upsertPayload.cancel_at_period_end = cancelAtPeriodEnd;
      if (supportAmountCents !== null) upsertPayload.support_amount_cents = supportAmountCents;
      break;

    case "subscription_cancelled":
      // When explicitly cancelled, usually it means "cancel at period end" in SaaS, 
      // OR it could be immediate. LemonSqueezy differentiates "cancelled" vs "expired".
      // "cancelled" usually means "won't renew".
      upsertPayload.subscription_status = status; // likely 'active' or 'cancelled' depending on API
      upsertPayload.lemon_customer_id = customerId;
      upsertPayload.lemon_subscription_id = subscriptionId;
      upsertPayload.lemon_variant_id = variantId;
      upsertPayload.billing_interval = billingInterval;
      // Ensure we mark the flag
      upsertPayload.cancel_at_period_end = true;
      if (currentPeriodEnd) upsertPayload.current_period_end = currentPeriodEnd;
      if (hasMappedPaidPlan) upsertPayload.plan_tier = mappedPlan;
      break;

    case "subscription_expired":
      upsertPayload.subscription_status = "expired";
      upsertPayload.lemon_customer_id = customerId;
      upsertPayload.lemon_subscription_id = subscriptionId;
      upsertPayload.lemon_variant_id = variantId;
      // Access revoked
      break;

    case "subscription_payment_failed":
      upsertPayload.subscription_status = "past_due";
      upsertPayload.lemon_customer_id = customerId;
      upsertPayload.lemon_subscription_id = subscriptionId;
      upsertPayload.lemon_variant_id = variantId;
      upsertPayload.billing_interval = billingInterval;
      if (currentPeriodEnd) upsertPayload.current_period_end = currentPeriodEnd;
      break;

    case "subscription_payment_success":
      if (!hasMappedPaidPlan) {
        log.warn(`[Billing] Ignoring subscription_payment_success with unmapped variant for user ${userId}`, {
          variantId,
          subscriptionId,
        });
        return { processed: true, ignored: true };
      }
      upsertPayload.plan_tier = mappedPlan;
      upsertPayload.subscription_status = "active";
      upsertPayload.lemon_customer_id = customerId;
      upsertPayload.lemon_subscription_id = subscriptionId;
      upsertPayload.lemon_variant_id = variantId;
      upsertPayload.billing_interval = billingInterval;
      if (currentPeriodEnd) upsertPayload.current_period_end = currentPeriodEnd;
      if (supportAmountCents !== null) upsertPayload.support_amount_cents = supportAmountCents;
      break;
      
    case "order_created":
        // Useful for one-time purchases (Lifetime deals) or simple orders.
        // If it resolves to a valid Plan, we activate it.
        if (hasMappedPaidPlan) {
             upsertPayload.plan_tier = mappedPlan;
             upsertPayload.subscription_status = "active";
             
             const derivedInterval = deriveBillingIntervalFromVariant(variantId);
             upsertPayload.billing_interval = derivedInterval || "year";
             
             const periodEnd = new Date();
             if (derivedInterval === "month") {
               periodEnd.setMonth(periodEnd.getMonth() + 1);
             } else {
               periodEnd.setFullYear(periodEnd.getFullYear() + 1);
             }
             upsertPayload.current_period_end = periodEnd.toISOString();
             
             upsertPayload.lemon_customer_id = customerId;
             upsertPayload.lemon_variant_id = variantId;
        } else {
            // Not a recognized plan variant, ignore.
             return { processed: true, ignored: true };
        }
        break;

    default:
      // Other events like 'subscription_paused', 'license_key_created' etc.
      // We can generic update if we have enough info, or ignore.
      // Better to log and ignore to avoid polluting DB with partial data.
      log.info(`[Billing] Unhandled event type: ${eventName}`);
      return { processed: true, ignored: true };
  }

  // Execute Upsert
  const { error: upsertError } = await supabase
    .from("user_billing")
    .upsert(upsertPayload, {
      onConflict: "user_id",
    });

  if (upsertError) {
    throw new Error(`Failed to upsert billing row for ${eventName}: ${upsertError.message}`);
  }

  return { processed: true };
}
