import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { resolvePlanFromVariantId } from "@/lib/billing/plan-resolver";
import type { BillingInterval, PlanTier, SubscriptionStatus } from "@/lib/billing/types";
import { log } from "@/lib/logger";

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    webhook_id?: string;
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

interface WebhookEventRow {
  id: number;
  processing_status: "pending" | "processed" | "failed";
  attempt_count: number;
}

interface ExistingUserBillingRow {
  current_period_end: string | null;
  lemon_last_event_at: string | null;
}

const REFUND_EVENT_NAMES = new Set([
  "order_refunded",
  "subscription_refunded",
  "subscription_payment_refunded",
  "charge_refunded",
]);

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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

function getProviderEventId(payload: LemonWebhookPayload): string | null {
  return coerceString(payload.meta?.webhook_id);
}

function deriveEventId(providerEventId: string | null, rawBody: string): string {
  if (providerEventId) {
    return `provider:${providerEventId}`;
  }

  return `sha256:${createHash("sha256").update(rawBody).digest("hex")}`;
}

function isRefundEvent(eventName: string): boolean {
  return REFUND_EVENT_NAMES.has(eventName);
}

function isOlderEvent(incomingAt: string | null, existingAt: string | null): boolean {
  if (!incomingAt || !existingAt) return false;
  return new Date(incomingAt).getTime() < new Date(existingAt).getTime();
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

export function mapStatus(rawStatus: unknown, eventName: string): SubscriptionStatus {
  const status = String(rawStatus || "").toLowerCase();

  if (isRefundEvent(eventName) || eventName === "subscription_expired") return "expired";
  if (eventName === "subscription_cancelled") return "canceled";
  if (eventName === "subscription_payment_success") return "active";
  if (eventName === "subscription_payment_failed") return "past_due";
  if (eventName === "subscription_resumed" || eventName === "subscription_unpaused") return "active";
  if (eventName === "subscription_paused") return "paused";

  if (status === "active" || status === "on_trial") return "active";
  if (status === "paused") return "paused";
  if (status === "past_due") return "past_due";
  if (status === "unpaid") return "unpaid";
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
  return "year";
}

async function lookupBillingByLemonIds(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string | null,
  subscriptionId: string | null
): Promise<ExistingBillingLookup | null> {
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

async function getOrCreateWebhookEvent(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    eventId: string;
    providerEventId: string | null;
    eventName: string;
    payload: LemonWebhookPayload;
  }
): Promise<WebhookEventRow> {
  const existing = await supabase
    .from("billing_webhook_events")
    .select("id, processing_status, attempt_count")
    .eq("event_id", input.eventId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to load webhook event record: ${existing.error.message}`);
  }

  if (existing.data) {
    return {
      id: Number(existing.data.id),
      processing_status: existing.data.processing_status as WebhookEventRow["processing_status"],
      attempt_count: Number(existing.data.attempt_count || 0),
    };
  }

  const inserted = await supabase
    .from("billing_webhook_events")
    .insert({
      event_id: input.eventId,
      provider_event_id: input.providerEventId,
      event_name: input.eventName,
      payload: input.payload,
      processing_status: "pending",
      attempt_count: 0,
    })
    .select("id, processing_status, attempt_count")
    .single();

  if (inserted.error || !inserted.data) {
    throw new Error(`Failed to create webhook event record: ${inserted.error?.message || "Unknown error"}`);
  }

  return {
    id: Number(inserted.data.id),
    processing_status: inserted.data.processing_status as WebhookEventRow["processing_status"],
    attempt_count: Number(inserted.data.attempt_count || 0),
  };
}

export async function processLemonWebhook(rawBody: string): Promise<ProcessWebhookResult> {
  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const eventName = asString(payload.meta?.event_name) || "unknown";
  const providerEventId = getProviderEventId(payload);
  const eventId = deriveEventId(providerEventId, rawBody);
  const supabase = createAdminClient();

  const eventRow = await getOrCreateWebhookEvent(supabase, {
    eventId,
    providerEventId,
    eventName,
    payload,
  });

  if (eventRow.processing_status === "processed") {
    return { processed: true, ignored: true };
  }

  const attemptCount = eventRow.attempt_count + 1;
  const attemptAt = new Date().toISOString();

  const markAttempt = await supabase
    .from("billing_webhook_events")
    .update({
      event_name: eventName,
      payload,
      provider_event_id: providerEventId,
      processing_status: "pending",
      attempt_count: attemptCount,
      last_attempt_at: attemptAt,
    })
    .eq("id", eventRow.id);

  if (markAttempt.error) {
    throw new Error(`Failed to update webhook attempt metadata: ${markAttempt.error.message}`);
  }

  try {
    const attributes = (payload.data?.attributes || {}) as Record<string, unknown>;
    const customData = payload.meta?.custom_data || {};

    const customerId = coerceString(attributes.customer_id) || coerceString(attributes.customer);
    const subscriptionId = coerceString(payload.data?.id) || coerceString(attributes.subscription_id);
    const explicitUserId = coerceString(customData.user_id) || coerceString(attributes.user_id);
    const providerEventAt = parseDateString(attributes.updated_at) || parseDateString(attributes.created_at);

    let userId = explicitUserId;
    if (!userId) {
      const existingBillingByIds = await lookupBillingByLemonIds(supabase, customerId, subscriptionId);
      userId = existingBillingByIds?.user_id || null;
    }

    if (!userId) {
      log.warn("[Billing] Could not identify user for webhook event", {
        eventId,
        eventName,
        providerEventId,
        customerId,
        subscriptionId,
        reason: "ids_only_matching_failed",
      });
      const processedAt = new Date().toISOString();
      const markUnknownUser = await supabase
        .from("billing_webhook_events")
        .update({
          processing_status: "processed",
          processed_at: processedAt,
          last_error: null,
          last_attempt_at: attemptAt,
        })
        .eq("id", eventRow.id);
      if (markUnknownUser.error) {
        throw new Error(`Failed to mark unmatched webhook event as processed: ${markUnknownUser.error.message}`);
      }
      return { processed: true, ignored: true };
    }

    const existingBillingResult = await supabase
      .from("user_billing")
      .select("current_period_end, lemon_last_event_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingBillingResult.error) {
      throw new Error(`Failed to read existing billing row: ${existingBillingResult.error.message}`);
    }

    const existingBilling = (existingBillingResult.data || null) as ExistingUserBillingRow | null;

    if (isOlderEvent(providerEventAt, existingBilling?.lemon_last_event_at || null)) {
      log.info("[Billing] Ignoring stale webhook event", {
        eventId,
        eventName,
        providerEventAt,
        existingEventAt: existingBilling?.lemon_last_event_at,
        userId,
      });
      const processedAt = new Date().toISOString();
      const markStale = await supabase
        .from("billing_webhook_events")
        .update({
          processing_status: "processed",
          processed_at: processedAt,
          last_error: null,
          last_attempt_at: attemptAt,
        })
        .eq("id", eventRow.id);
      if (markStale.error) {
        throw new Error(`Failed to mark stale webhook event as processed: ${markStale.error.message}`);
      }
      return { processed: true, ignored: true };
    }

    const variantId =
      coerceString(attributes.variant_id) ||
      coerceString((attributes.first_order_item as Record<string, unknown>)?.variant_id);

    const mappedPlan = resolvePlanFromVariantId(variantId);
    const hasMappedPaidPlan = mappedPlan === "pro" || mappedPlan === "believer";

    const status = mapStatus(attributes.status, eventName);
    const billingInterval =
      mapInterval(attributes.billing_interval || attributes.interval) || deriveBillingIntervalFromVariant(variantId);

    const incomingCurrentPeriodEnd =
      parseDateString(attributes.renews_at) ||
      parseDateString(attributes.ends_at) ||
      parseDateString(attributes.trial_ends_at);
    const resolvedCurrentPeriodEnd = incomingCurrentPeriodEnd || existingBilling?.current_period_end || null;

    const cancelAtPeriodEnd =
      Boolean(attributes.cancel_at_period_end) ||
      Boolean(attributes.cancelled) ||
      eventName === "subscription_cancelled";

    const supportAmountCents = extractSupportAmountCents(attributes);
    const now = new Date().toISOString();

    const upsertPayload: Record<string, unknown> = {
      user_id: userId,
      last_webhook_event_at: now,
      lemon_last_event_at: providerEventAt || now,
      updated_at: now,
    };

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused":
      case "subscription_paused":
        if (!hasMappedPaidPlan) {
          log.warn("[Billing] Ignoring paid subscription event with unmapped variant", {
            eventName,
            userId,
            variantId,
            subscriptionId,
          });
          const processedAt = new Date().toISOString();
          const markUnmappedPaid = await supabase
            .from("billing_webhook_events")
            .update({
              processing_status: "processed",
              processed_at: processedAt,
              last_error: null,
              last_attempt_at: attemptAt,
            })
            .eq("id", eventRow.id);
          if (markUnmappedPaid.error) {
            throw new Error(
              `Failed to mark unmapped paid webhook event as processed: ${markUnmappedPaid.error.message}`
            );
          }
          return { processed: true, ignored: true };
        }

        upsertPayload.plan_tier = mappedPlan;
        upsertPayload.subscription_status = status;
        upsertPayload.billing_interval = billingInterval;
        upsertPayload.cancel_at_period_end = cancelAtPeriodEnd;
        upsertPayload.lemon_customer_id = customerId;
        upsertPayload.lemon_subscription_id = subscriptionId;
        upsertPayload.lemon_variant_id = variantId;
        if (resolvedCurrentPeriodEnd) upsertPayload.current_period_end = resolvedCurrentPeriodEnd;
        if (supportAmountCents !== null) upsertPayload.support_amount_cents = supportAmountCents;
        break;

      case "subscription_cancelled":
        upsertPayload.subscription_status = status;
        upsertPayload.cancel_at_period_end = true;
        upsertPayload.lemon_customer_id = customerId;
        upsertPayload.lemon_subscription_id = subscriptionId;
        upsertPayload.lemon_variant_id = variantId;
        if (billingInterval) upsertPayload.billing_interval = billingInterval;
        if (resolvedCurrentPeriodEnd) upsertPayload.current_period_end = resolvedCurrentPeriodEnd;
        if (hasMappedPaidPlan) upsertPayload.plan_tier = mappedPlan;
        break;

      case "subscription_expired":
        upsertPayload.subscription_status = "expired";
        upsertPayload.lemon_customer_id = customerId;
        upsertPayload.lemon_subscription_id = subscriptionId;
        upsertPayload.lemon_variant_id = variantId;
        if (resolvedCurrentPeriodEnd) upsertPayload.current_period_end = resolvedCurrentPeriodEnd;
        break;

      case "subscription_payment_failed":
        upsertPayload.subscription_status = "past_due";
        upsertPayload.lemon_customer_id = customerId;
        upsertPayload.lemon_subscription_id = subscriptionId;
        upsertPayload.lemon_variant_id = variantId;
        if (billingInterval) upsertPayload.billing_interval = billingInterval;
        if (resolvedCurrentPeriodEnd) upsertPayload.current_period_end = resolvedCurrentPeriodEnd;
        break;

      case "subscription_payment_success":
        if (!hasMappedPaidPlan) {
          log.warn("[Billing] Ignoring subscription payment success with unmapped variant", {
            eventName,
            userId,
            variantId,
            subscriptionId,
          });
          const processedAt = new Date().toISOString();
          const markUnmappedPayment = await supabase
            .from("billing_webhook_events")
            .update({
              processing_status: "processed",
              processed_at: processedAt,
              last_error: null,
              last_attempt_at: attemptAt,
            })
            .eq("id", eventRow.id);
          if (markUnmappedPayment.error) {
            throw new Error(
              `Failed to mark unmapped payment success webhook event as processed: ${markUnmappedPayment.error.message}`
            );
          }
          return { processed: true, ignored: true };
        }

        upsertPayload.plan_tier = mappedPlan;
        upsertPayload.subscription_status = "active";
        upsertPayload.cancel_at_period_end = cancelAtPeriodEnd;
        upsertPayload.lemon_customer_id = customerId;
        upsertPayload.lemon_subscription_id = subscriptionId;
        upsertPayload.lemon_variant_id = variantId;
        upsertPayload.billing_interval = billingInterval;
        if (resolvedCurrentPeriodEnd) upsertPayload.current_period_end = resolvedCurrentPeriodEnd;
        if (supportAmountCents !== null) upsertPayload.support_amount_cents = supportAmountCents;
        break;

      case "order_created":
        log.info("[Billing] Ignoring order_created for subscriptions-only billing mode", {
          userId,
          eventId,
        });
        const processedAtOrder = new Date().toISOString();
        const markOrderIgnored = await supabase
          .from("billing_webhook_events")
          .update({
            processing_status: "processed",
            processed_at: processedAtOrder,
            last_error: null,
            last_attempt_at: attemptAt,
          })
          .eq("id", eventRow.id);
        if (markOrderIgnored.error) {
          throw new Error(`Failed to mark order_created webhook event as processed: ${markOrderIgnored.error.message}`);
        }
        return { processed: true, ignored: true };

      default:
        if (isRefundEvent(eventName)) {
          upsertPayload.plan_tier = "starter";
          upsertPayload.subscription_status = "expired";
          upsertPayload.cancel_at_period_end = false;
          upsertPayload.current_period_end = now;
          upsertPayload.lemon_customer_id = customerId;
          upsertPayload.lemon_subscription_id = subscriptionId;
          upsertPayload.lemon_variant_id = variantId;
          if (billingInterval) upsertPayload.billing_interval = billingInterval;
          break;
        }

        log.info("[Billing] Unhandled webhook event type", {
          eventName,
          eventId,
        });
        const processedAtUnhandled = new Date().toISOString();
        const markUnhandled = await supabase
          .from("billing_webhook_events")
          .update({
            processing_status: "processed",
            processed_at: processedAtUnhandled,
            last_error: null,
            last_attempt_at: attemptAt,
          })
          .eq("id", eventRow.id);
        if (markUnhandled.error) {
          throw new Error(`Failed to mark unhandled webhook event as processed: ${markUnhandled.error.message}`);
        }
        return { processed: true, ignored: true };
    }

    const { error: upsertError } = await supabase.from("user_billing").upsert(upsertPayload, {
      onConflict: "user_id",
    });

    if (upsertError) {
      throw new Error(`Failed to upsert billing row for ${eventName}: ${upsertError.message}`);
    }

    const processedAt = new Date().toISOString();
    const markProcessed = await supabase
      .from("billing_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: processedAt,
        last_error: null,
        last_attempt_at: attemptAt,
      })
      .eq("id", eventRow.id);

    if (markProcessed.error) {
      throw new Error(`Failed to mark webhook event as processed: ${markProcessed.error.message}`);
    }

    return { processed: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const markFailed = await supabase
      .from("billing_webhook_events")
      .update({
        processing_status: "failed",
        last_error: errorMessage,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", eventRow.id);

    if (markFailed.error) {
      log.error("[Billing] Failed to mark webhook event as failed", markFailed.error);
    }

    throw error;
  }
}
