import { createAdminClient } from "@/lib/supabase/server";
import { resolvePlanFromVariantId, getUserBillingRecord } from "@/lib/billing/plan-resolver";
import { lemonRequest } from "@/lib/billing/lemon-client";
import { mapStatus, mapInterval, deriveBillingIntervalFromVariant } from "@/lib/billing/webhook-handler";
import { log } from "@/lib/logger";

export type BillingSyncSource = "local_subscription_id" | "email_bootstrap" | "customer_bootstrap" | "none";
export type BillingSyncReason =
  | "no_local_subscription"
  | "no_user_email"
  | "no_matching_subscription"
  | "unmapped_variant"
  | "no_mapped_candidate"
  | "lemon_error"
  | "database_error";

export interface BillingSyncResult {
  synced: boolean;
  source: BillingSyncSource;
  reason?: BillingSyncReason;
  message?: string;
}

interface LemonSubscriptionCandidate {
  subscriptionId: string;
  customerId: string | null;
  variantId: string | null;
  status: string | null;
  billingInterval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string | null;
}

interface CandidateSelection {
  candidate: LemonSubscriptionCandidate | null;
  hasEligible: boolean;
  hasMappedEligible: boolean;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

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

function extractSubscriptionCandidate(item: Record<string, unknown>): LemonSubscriptionCandidate | null {
  const attributes = (item.attributes || {}) as Record<string, unknown>;
  const subscriptionId = asString(item.id);
  if (!subscriptionId) return null;

  return {
    subscriptionId,
    customerId: asString(attributes.customer_id) || asString(attributes.customer),
    variantId: asString(attributes.variant_id),
    status: asString(attributes.status),
    billingInterval: mapInterval(attributes.billing_interval || attributes.interval),
    currentPeriodEnd:
      parseDateString(attributes.renews_at) ||
      parseDateString(attributes.ends_at) ||
      parseDateString(attributes.trial_ends_at),
    cancelAtPeriodEnd: Boolean(attributes.cancel_at_period_end) || Boolean(attributes.cancelled),
    updatedAt: parseDateString(attributes.updated_at) || parseDateString(attributes.created_at),
  };
}

function compareCandidates(a: LemonSubscriptionCandidate, b: LemonSubscriptionCandidate): number {
  const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  return bUpdated - aUpdated;
}

function isEligibleCandidate(candidate: LemonSubscriptionCandidate): boolean {
  const normalizedStatus = String(candidate.status || "").toLowerCase();
  if (
    normalizedStatus === "active" ||
    normalizedStatus === "on_trial" ||
    normalizedStatus === "past_due" ||
    normalizedStatus === "paused" ||
    normalizedStatus === "unpaid"
  ) {
    return true;
  }

  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
    if (!candidate.currentPeriodEnd) return false;
    return new Date(candidate.currentPeriodEnd).getTime() > Date.now();
  }

  return false;
}

function isMappedCandidate(candidate: LemonSubscriptionCandidate): boolean {
  return resolvePlanFromVariantId(candidate.variantId) !== null;
}

async function fetchSubscriptionsByFilter(
  key: "user_email" | "customer_id",
  value: string
): Promise<LemonSubscriptionCandidate[]> {
  const results: LemonSubscriptionCandidate[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const query = `/subscriptions?filter[${key}]=${encodeURIComponent(value)}&page[size]=${PAGE_SIZE}&page[number]=${page}`;
    const payload = await lemonRequest(query);
    const rows = Array.isArray(payload.data) ? payload.data : [];

    for (const row of rows) {
      if (typeof row !== "object" || !row) continue;
      const candidate = extractSubscriptionCandidate(row as Record<string, unknown>);
      if (candidate) results.push(candidate);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return results;
}

async function fetchCustomerIdsByEmail(email: string): Promise<string[]> {
  const ids = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const query = `/customers?filter[email]=${encodeURIComponent(email)}&page[size]=${PAGE_SIZE}&page[number]=${page}`;
    const payload = await lemonRequest(query);
    const rows = Array.isArray(payload.data) ? payload.data : [];

    for (const row of rows) {
      if (typeof row !== "object" || !row) continue;
      const id = asString((row as Record<string, unknown>).id);
      if (id) ids.add(id);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return [...ids];
}

function selectBestCandidate(candidates: LemonSubscriptionCandidate[]): CandidateSelection {
  const eligible = candidates.filter(isEligibleCandidate);
  const mappedEligible = eligible.filter(isMappedCandidate).sort(compareCandidates);

  return {
    candidate: mappedEligible[0] || null,
    hasEligible: eligible.length > 0,
    hasMappedEligible: mappedEligible.length > 0,
  };
}

async function upsertUserBilling(args: {
  userId: string;
  candidate: LemonSubscriptionCandidate;
  existingCurrentPeriodEnd: string | null;
}): Promise<BillingSyncResult> {
  const { userId, candidate, existingCurrentPeriodEnd } = args;
  const planTier = resolvePlanFromVariantId(candidate.variantId);
  if (!planTier) {
    return {
      synced: false,
      source: "none",
      reason: "unmapped_variant",
      message: "Subscription found but variant is not mapped to an app plan",
    };
  }

  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { error } = await supabase.from("user_billing").upsert(
    {
      user_id: userId,
      plan_tier: planTier,
      subscription_status: mapStatus(candidate.status, "sync"),
      billing_interval: candidate.billingInterval || deriveBillingIntervalFromVariant(candidate.variantId),
      current_period_end: candidate.currentPeriodEnd || existingCurrentPeriodEnd,
      cancel_at_period_end: candidate.cancelAtPeriodEnd,
      lemon_customer_id: candidate.customerId,
      lemon_subscription_id: candidate.subscriptionId,
      lemon_variant_id: candidate.variantId,
      last_webhook_event_at: now,
      lemon_last_event_at: now,
      updated_at: now,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    return {
      synced: false,
      source: "none",
      reason: "database_error",
      message: `Database update failed: ${error.message}`,
    };
  }

  return {
    synced: true,
    source: "local_subscription_id",
  };
}

export async function syncSubscription(userId: string, userEmail: string | null): Promise<BillingSyncResult> {
  const billing = await getUserBillingRecord(userId);
  let localLookupFailed = false;
  let foundEligibleUnmapped = false;

  try {
    if (billing?.lemon_subscription_id) {
      try {
        const payload = await lemonRequest(`/subscriptions/${billing.lemon_subscription_id}`);
        const data = payload.data as Record<string, unknown> | undefined;
        const candidate = data ? extractSubscriptionCandidate(data) : null;

        if (!candidate || !isEligibleCandidate(candidate)) {
          localLookupFailed = true;
        } else if (isMappedCandidate(candidate)) {
          const result = await upsertUserBilling({
            userId,
            candidate,
            existingCurrentPeriodEnd: billing.current_period_end,
          });
          return {
            ...result,
            source: result.synced ? "local_subscription_id" : result.source,
          };
        } else {
          foundEligibleUnmapped = true;
          localLookupFailed = true;
        }
      } catch (err) {
        localLookupFailed = true;
        log.warn(`[BillingSync] Local subscription lookup failed for user ${userId}`, {
          subscriptionId: billing.lemon_subscription_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (!userEmail) {
      return {
        synced: false,
        source: "none",
        reason: "no_user_email",
        message: "No user email available for billing bootstrap",
      };
    }

    const byEmail = await fetchSubscriptionsByFilter("user_email", userEmail);
    const emailSelection = selectBestCandidate(byEmail);
    if (emailSelection.candidate) {
      const result = await upsertUserBilling({
        userId,
        candidate: emailSelection.candidate,
        existingCurrentPeriodEnd: billing?.current_period_end || null,
      });
      return {
        ...result,
        source: result.synced ? "email_bootstrap" : result.source,
      };
    }
    if (emailSelection.hasEligible && !emailSelection.hasMappedEligible) {
      foundEligibleUnmapped = true;
    }

    const customerIds = await fetchCustomerIdsByEmail(userEmail);
    for (const customerId of customerIds) {
      try {
        const subscriptions = await fetchSubscriptionsByFilter("customer_id", customerId);
        const customerSelection = selectBestCandidate(subscriptions);
        if (!customerSelection.candidate) {
          if (customerSelection.hasEligible && !customerSelection.hasMappedEligible) {
            foundEligibleUnmapped = true;
          }
          continue;
        }

        const result = await upsertUserBilling({
          userId,
          candidate: customerSelection.candidate,
          existingCurrentPeriodEnd: billing?.current_period_end || null,
        });

        return {
          ...result,
          source: result.synced ? "customer_bootstrap" : result.source,
        };
      } catch {
        // Continue attempting remaining customers; some Lemon accounts may not support this filter.
      }
    }

    if (foundEligibleUnmapped) {
      return {
        synced: false,
        source: "none",
        reason: "no_mapped_candidate",
        message: "Subscriptions were found but none matched configured paid variants",
      };
    }

    return {
      synced: false,
      source: "none",
      reason: localLookupFailed ? "no_matching_subscription" : "no_local_subscription",
      message: "No matching active subscription found for this account",
    };
  } catch (err) {
    log.error(`[BillingSync] Failed to sync for user ${userId}`, err);
    return {
      synced: false,
      source: "none",
      reason: "lemon_error",
      message: err instanceof Error ? err.message : "Unknown sync error",
    };
  }
}
