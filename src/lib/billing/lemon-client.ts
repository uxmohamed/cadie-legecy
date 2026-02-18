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

async function lemonRequest(path: string, options: LemonRequestOptions = {}): Promise<Record<string, unknown>> {
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
      enabled_variants: [input.variantId],
      redirect_url: input.checkoutReturnUrl || undefined,
    },
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
