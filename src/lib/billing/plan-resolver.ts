import { createAdminClient } from "@/lib/supabase/server";
import type {
  BillingInterval,
  PlanTier,
  SubscriptionStatus,
  UserBillingRecord,
} from "@/lib/billing/types";

const ACTIVE_STATUSES = new Set<SubscriptionStatus>(["active", "past_due", "canceled"]);

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toPlanTier(value: unknown): PlanTier {
  if (value === "pro" || value === "believer") return value;
  return "starter";
}

function toSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (value === "active" || value === "past_due" || value === "canceled" || value === "expired") {
    return value;
  }
  return "inactive";
}

function toBillingInterval(value: unknown): BillingInterval {
  if (value === "month" || value === "year") return value;
  return null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function normalizeBillingRow(row: Record<string, unknown>): UserBillingRecord {
  return {
    user_id: String(row.user_id),
    plan_tier: toPlanTier(row.plan_tier),
    subscription_status: toSubscriptionStatus(row.subscription_status),
    billing_interval: toBillingInterval(row.billing_interval),
    lemon_customer_id: asString(row.lemon_customer_id),
    lemon_subscription_id: asString(row.lemon_subscription_id),
    lemon_variant_id: asString(row.lemon_variant_id),
    current_period_end: asString(row.current_period_end),
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    support_amount_cents:
      typeof row.support_amount_cents === "number"
        ? row.support_amount_cents
        : row.support_amount_cents == null
          ? null
          : Number(row.support_amount_cents),
    last_webhook_event_at: asString(row.last_webhook_event_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function hasPaidAccess(record: UserBillingRecord, now: Date): boolean {
  if (!ACTIVE_STATUSES.has(record.subscription_status)) {
    return false;
  }

  const currentPeriodEnd = parseDate(record.current_period_end);
  if (!currentPeriodEnd) {
    return record.subscription_status === "active";
  }

  return currentPeriodEnd.getTime() > now.getTime();
}

export function resolvePlanFromVariantId(rawVariantId: unknown): PlanTier | null {
  const variantId = String(rawVariantId || "").trim();
  if (!variantId) return null;

  const proMonthly = process.env.LEMON_VARIANT_PRO_MONTHLY;
  const proYearly = process.env.LEMON_VARIANT_PRO_YEARLY;
  const believerYearly = process.env.LEMON_VARIANT_BELIEVER_YEARLY;

  if ((proMonthly && variantId === proMonthly) || (proYearly && variantId === proYearly)) {
    return "pro";
  }

  if (believerYearly && variantId === believerYearly) {
    return "believer";
  }

  return null;
}

export async function getUserBillingRecord(userId: string): Promise<UserBillingRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_billing")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeBillingRow(data as Record<string, unknown>);
}

export async function resolvePlanForUser(userId: string): Promise<{ plan: PlanTier; billing: UserBillingRecord | null }> {
  const billing = await getUserBillingRecord(userId);
  if (!billing) {
    return { plan: "starter", billing: null };
  }

  const plan = hasPaidAccess(billing, new Date()) ? billing.plan_tier : "starter";
  return { plan, billing };
}
