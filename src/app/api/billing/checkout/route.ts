import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createLemonCheckout, getVariantIdForSelection } from "@/lib/billing/lemon-client";
import type { BillingInterval, PlanTier } from "@/lib/billing/types";
import { log } from "@/lib/logger";

interface CheckoutBody {
  plan: PlanTier;
  interval?: BillingInterval;
  support_amount_cents?: number;
  return_url?: string;
}

const DEFAULT_BILLING_RETURN_PATH = "/?settings=billing";
const MAX_SUPPORT_AMOUNT_CENTS = 1_000_000; // $10,000 upper guardrail
const INVALID_PUBLIC_HOSTS = new Set(["0.0.0.0", "::", "::1", "localhost", "127.0.0.1"]);

function normalizePlan(value: unknown): PlanTier | null {
  if (value === "pro" || value === "believer" || value === "starter") {
    return value;
  }
  return null;
}

function normalizeIntervalForPlan(plan: Exclude<PlanTier, "starter">, value: unknown): BillingInterval | null {
  if (plan === "believer") return "year";
  if (value === "month" || value === "year") return value;
  if (value == null) return "month";
  return null;
}

function toHttpOrigin(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function isInvalidPublicHost(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return INVALID_PUBLIC_HOSTS.has(hostname);
  } catch {
    return true;
  }
}

function resolveCheckoutOrigin(request: NextRequest): string {
  const requestOrigin = toHttpOrigin(request.nextUrl.origin);
  if (requestOrigin && !isInvalidPublicHost(requestOrigin)) {
    return requestOrigin;
  }

  const envOriginCandidates = [
    toHttpOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    toHttpOrigin(process.env.NEXT_PUBLIC_BASE_URL),
    toHttpOrigin(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null
    ),
    toHttpOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null),
  ];

  for (const origin of envOriginCandidates) {
    if (origin && !isInvalidPublicHost(origin)) {
      return origin;
    }
  }

  if (requestOrigin) {
    return requestOrigin;
  }

  return "http://localhost:3000";
}

function normalizeReturnUrl(rawUrl: unknown, origin: string): string {
  const fallback = `${origin}${DEFAULT_BILLING_RETURN_PATH}`;
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return fallback;

  try {
    const parsed = new URL(rawUrl, origin);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    if (!isHttp || parsed.origin !== origin) {
      return fallback;
    }
    return parsed.toString();
  } catch {
    return fallback;
  }
}

function normalizeSupportAmount(plan: Exclude<PlanTier, "starter">, rawAmount: unknown): number | null {
  if (plan !== "believer") return null;
  if (typeof rawAmount !== "number" || !Number.isFinite(rawAmount)) return null;

  const amount = Math.round(rawAmount);
  if (amount <= 0) return null;
  return Math.min(amount, MAX_SUPPORT_AMOUNT_CENTS);
}

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutBody;
    const plan = normalizePlan(body.plan);
    if (!plan || plan === "starter") {
      return NextResponse.json({ error: "A paid plan is required for checkout" }, { status: 400 });
    }

    const interval = normalizeIntervalForPlan(plan, body.interval);
    if (!interval) {
      return NextResponse.json({ error: "Invalid billing interval for selected plan" }, { status: 400 });
    }

    const supportAmountCents = normalizeSupportAmount(plan, body.support_amount_cents);
    const checkoutOrigin = resolveCheckoutOrigin(request);
    const checkoutReturnUrl = normalizeReturnUrl(body.return_url, checkoutOrigin);

    const variantId = getVariantIdForSelection(plan, interval);
    const checkout = await createLemonCheckout({
      variantId,
      userId: user.id,
      email: user.email ?? null,
      supportAmountCents,
      checkoutReturnUrl,
    });

    return NextResponse.json({
      checkout_url: checkout.checkoutUrl,
      plan,
      interval,
    });
  } catch (error) {
    log.error("[Billing] Failed to create checkout", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
