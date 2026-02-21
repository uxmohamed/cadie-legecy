import { resolvePlanFromVariantId } from "@/lib/billing/plan-resolver";
import type { BillingInterval, PlanTier } from "@/lib/billing/types";

const LEMON_API_BASE = "https://api.lemonsqueezy.com/v1";

interface LemonRequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: Record<string, unknown>;
}

interface CreateCheckoutInput {
  variantId: string;
  userId: string;
  email: string | null;
  checkoutReturnUrl?: string;
  supportAmountCents?: number | null;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function lemonRequest(path: string, options: LemonRequestOptions = {}): Promise<Record<string, unknown>> {
  const apiKey = getRequiredEnv("LEMONSQUEEZY_API_KEY");

  const response = await fetch(`${LEMON_API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const firstError = Array.isArray(payload.errors) ? payload.errors[0] : null;
    const detail = firstError && typeof firstError === "object" ? (firstError as Record<string, unknown>).detail : null;
    const message = typeof detail === "string" ? detail : `Lemon API request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

// ---------- Public pricing (server-side, cached) ----------

export interface PlanPricing {
  proMonthlyFormatted: string;   // e.g. "$7.9"
  proYearlyFormatted: string;    // e.g. "$79.9"
  proMonthlyCents: number;       // e.g. 790
  proYearlyCents: number;        // e.g. 7990
  believerYearly: number | null; // null = PWYW
}

/**
 * Fetch live prices from Lemon Squeezy variants.
 * Called server-side so API key stays hidden; cached for 1 hour via Next.js.
 */
function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export async function fetchVariantPrices(): Promise<PlanPricing> {
  const DEFAULTS: PlanPricing = {
    proMonthlyFormatted: "$7.9",
    proYearlyFormatted: "$79.9",
    proMonthlyCents: 790,
    proYearlyCents: 7990,
    believerYearly: null,
  };

  try {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const proMonthlyId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
    const proYearlyId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

    if (!apiKey || !proMonthlyId || !proYearlyId) return DEFAULTS;

    const fetchVariantPrice = async (variantId: string): Promise<number | null> => {
      const res = await fetch(`${LEMON_API_BASE}/variants/${variantId}`, {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        next: { revalidate: 3600 }, // cache for 1 hour
      });
      if (!res.ok) return null;
      const json = (await res.json()) as Record<string, unknown>;
      const data = json.data as Record<string, unknown> | undefined;
      const attrs = data?.attributes as Record<string, unknown> | undefined;
      const priceCents = attrs?.price as number | undefined;
      return typeof priceCents === "number" ? priceCents : null;
    };

    const [monthlyCents, yearlyCents] = await Promise.all([
      fetchVariantPrice(proMonthlyId),
      fetchVariantPrice(proYearlyId),
    ]);

    const mc = monthlyCents ?? DEFAULTS.proMonthlyCents;
    const yc = yearlyCents ?? DEFAULTS.proYearlyCents;

    return {
      proMonthlyFormatted: formatPrice(mc),
      proYearlyFormatted: formatPrice(yc),
      proMonthlyCents: mc,
      proYearlyCents: yc,
      believerYearly: null, // PWYW
    };
  } catch {
    return DEFAULTS;
  }
}

export function getVariantIdForSelection(plan: PlanTier, interval: BillingInterval): string {
  if (plan === "pro") {
    if (interval === "month") {
      return getRequiredEnv("LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID");
    }
    if (interval === "year") {
      return getRequiredEnv("LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID");
    }
    throw new Error("Pro checkout requires month or year interval");
  }

  if (plan === "believer") {
    if (interval !== "year") {
      throw new Error("Believer plan is yearly only");
    }
    return getRequiredEnv("LEMONSQUEEZY_BELIEVER_YEARLY_VARIANT_ID");
  }

  throw new Error("Starter does not have a paid checkout variant");
}

export async function createLemonCheckout(input: CreateCheckoutInput): Promise<{ checkoutUrl: string }> {
  const storeId = getRequiredEnv("LEMONSQUEEZY_STORE_ID");

  const checkoutData: Record<string, unknown> = {
    custom: {
      user_id: input.userId,
    },
  };

  if (input.email) {
    checkoutData.email = input.email;
  }

  const checkoutAttributes: Record<string, unknown> = {
    checkout_data: checkoutData,
    checkout_options: {
      embed: false,
      media: true,
    },
    product_options: {
      redirect_url: input.checkoutReturnUrl || undefined,
    },
    test_mode: process.env.LEMONSQUEEZY_TEST_MODE === "true" || process.env.NODE_ENV === "development",
  };

  // Believer PWYW: set custom_price at the attributes level
  if (typeof input.supportAmountCents === "number" && input.supportAmountCents > 0) {
    checkoutAttributes.custom_price = input.supportAmountCents;
  }

  const body: Record<string, unknown> = {
    data: {
      type: "checkouts",
      attributes: checkoutAttributes,
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: input.variantId,
          },
        },
      },
    },
  };

  const payload = await lemonRequest("/checkouts", {
    method: "POST",
    body,
  });

  const data = payload.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const checkoutUrl = attributes?.url;

  if (typeof checkoutUrl !== "string" || !checkoutUrl) {
    throw new Error("Lemon checkout URL was not returned");
  }

  return { checkoutUrl };
}

export async function getCustomerPortalUrl(lemonSubscriptionId: string): Promise<{ portalUrl: string }> {
  const payload = await lemonRequest(`/subscriptions/${lemonSubscriptionId}`);

  const data = payload.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const urls = attributes?.urls as Record<string, unknown> | undefined;
  const portalUrl = urls?.customer_portal;

  if (typeof portalUrl !== "string" || !portalUrl) {
    throw new Error("Customer portal URL was not found on subscription");
  }

  return { portalUrl };
}

export function mapVariantIdToPlan(variantId: string | null): PlanTier | null {
  if (!variantId) return null;
  return resolvePlanFromVariantId(variantId);
}
