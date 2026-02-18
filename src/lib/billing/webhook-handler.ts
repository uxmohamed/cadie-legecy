import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { resolvePlanFromVariantId } from "@/lib/billing/plan-resolver";
import type { BillingInterval, PlanTier, SubscriptionStatus } from "@/lib/billing/types";

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

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

function deriveEventId(payload: LemonWebhookPayload, rawBody: string): string {
  const eventName = asString(payload.meta?.event_name) || "unknown";
  const subscriptionId = coerceString(payload.data?.id) || "unknown";
  const bodyHash = createHash("sha256").update(rawBody).digest("hex").slice(0, 16);

  return `${eventName}:${subscriptionId}:${bodyHash}`;
}

function mapStatus(rawStatus: unknown, eventName: string): SubscriptionStatus {
  const status = String(rawStatus || "").toLowerCase();

  if (eventName.includes("expired")) return "expired";
  if (eventName.includes("cancel")) return "canceled";

  if (status === "active" || status === "on_trial") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "cancelled" || status === "canceled") return "canceled";
  if (status === "expired") return "expired";

  return "inactive";
}

function mapInterval(rawInterval: unknown): BillingInterval {
  if (rawInterval == null) return null;
  const value = String(rawInterval).toLowerCase();
  if (value === "month" || value === "monthly") return "month";
  if (value === "year" || value === "yearly" || value === "annually") return "year";
  return null;
}

function deriveBillingIntervalFromVariant(variantId: string | null): BillingInterval {
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

  if (eventInsert.error && eventInsert.error.code === "23505") {
    return { processed: true, ignored: true };
  }

  if (eventInsert.error) {
    throw new Error(`Failed to persist webhook event: ${eventInsert.error.message}`);
  }

  const attributes = (payload.data?.attributes || {}) as Record<string, unknown>;
  const customerId = coerceString(attributes.customer_id) || coerceString(attributes.customer);
  const subscriptionId = coerceString(payload.data?.id) || coerceString(attributes.subscription_id);
  const variantId = coerceString(attributes.variant_id);

  const customData = payload.meta?.custom_data || {};
  const explicitUserId = coerceString(customData.user_id) || coerceString(attributes.user_id);

  const existing = await lookupBillingByLemonIds(customerId, subscriptionId);
  const userId = explicitUserId || existing?.user_id;

  if (!userId) {
    return { processed: true, ignored: true };
  }

  const mappedPlan = resolvePlanFromVariantId(variantId);
  const planTier = mappedPlan || existing?.plan_tier || "starter";

  const status = mapStatus(attributes.status, eventName);
  // billing_anchor is day-of-month, not the interval — derive interval from variant mapping
  const billingInterval = mapInterval(attributes.billing_interval || attributes.interval) || deriveBillingIntervalFromVariant(variantId);
  const currentPeriodEnd =
    parseDateString(attributes.renews_at) ||
    parseDateString(attributes.ends_at) ||
    parseDateString(attributes.trial_ends_at);

  const cancelAtPeriodEnd =
    Boolean(attributes.cancel_at_period_end) ||
    Boolean(attributes.cancelled) ||
    eventName.includes("cancel");

  const supportAmountCents = extractSupportAmountCents(attributes);

  const now = new Date().toISOString();
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    plan_tier: planTier,
    subscription_status: status,
    billing_interval: billingInterval,
    lemon_customer_id: customerId,
    lemon_subscription_id: subscriptionId,
    lemon_variant_id: variantId,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    last_webhook_event_at: now,
    updated_at: now,
  };

  if (supportAmountCents !== null) {
    upsertPayload.support_amount_cents = supportAmountCents;
  }

  const { error: upsertError } = await supabase
    .from("user_billing")
    .upsert(upsertPayload, {
      onConflict: "user_id",
    });

  if (upsertError) {
    throw new Error(`Failed to upsert billing row: ${upsertError.message}`);
  }

  return { processed: true };
}
