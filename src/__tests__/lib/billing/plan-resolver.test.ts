/**
 * Comprehensive tests for billing plan resolution logic.
 * Tests hasPaidAccess, resolvePlanForUser, and resolvePlanFromVariantId.
 */

import { resolvePlanForUser, getUserBillingRecord, resolvePlanFromVariantId } from "@/lib/billing/plan-resolver";
import { createAdminClient } from "@/lib/supabase/server";
import type { UserBillingRecord } from "@/lib/billing/types";

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

function makeBillingRecord(overrides: Partial<UserBillingRecord> = {}): UserBillingRecord {
  return {
    user_id: "user_123",
    plan_tier: "pro",
    subscription_status: "active",
    billing_interval: "month",
    lemon_customer_id: "cust_1",
    lemon_subscription_id: "sub_1",
    lemon_variant_id: "var_1",
    current_period_end: null,
    cancel_at_period_end: false,
    support_amount_cents: null,
    last_webhook_event_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeMockSupabase(data: unknown, error: unknown = null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from, select, eq, maybeSingle };
}

describe("resolvePlanFromVariantId", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID: "pro_monthly_id",
      LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID: "pro_yearly_id",
      LEMONSQUEEZY_BELIEVER_YEARLY_VARIANT_ID: "believer_yearly_id",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 'pro' for monthly variant", () => {
    expect(resolvePlanFromVariantId("pro_monthly_id")).toBe("pro");
  });

  it("returns 'pro' for yearly variant", () => {
    expect(resolvePlanFromVariantId("pro_yearly_id")).toBe("pro");
  });

  it("returns 'believer' for believer variant", () => {
    expect(resolvePlanFromVariantId("believer_yearly_id")).toBe("believer");
  });

  it("returns null for unknown variant", () => {
    expect(resolvePlanFromVariantId("unknown_variant")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolvePlanFromVariantId("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(resolvePlanFromVariantId(null)).toBeNull();
  });
});

describe("resolvePlanForUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID: "pro_monthly_id",
      LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID: "pro_yearly_id",
      LEMONSQUEEZY_BELIEVER_YEARLY_VARIANT_ID: "believer_yearly_id",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 'starter' when no billing record exists", async () => {
    const supabase = makeMockSupabase(null);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan, billing } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
    expect(billing).toBeNull();
  });

  it("returns stored plan tier when subscription is active", async () => {
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "active",
      current_period_end: null,
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("pro");
  });

  it("returns 'believer' plan when status is active", async () => {
    const record = makeBillingRecord({
      plan_tier: "believer",
      subscription_status: "active",
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("believer");
  });

  it("fails closed to starter when paid row has no verifiable Lemon linkage", async () => {
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "active",
      lemon_subscription_id: null,
      lemon_variant_id: null,
      current_period_end: null,
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
  });

  it("grants access when paid row has mapped variant even without subscription id", async () => {
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "active",
      lemon_subscription_id: null,
      lemon_variant_id: "pro_monthly_id",
      current_period_end: null,
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("pro");
  });

  it("returns 'starter' when subscription is expired", async () => {
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "expired",
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
  });

  it("returns 'starter' when subscription is inactive (never subscribed)", async () => {
    const record = makeBillingRecord({
      plan_tier: "starter",
      subscription_status: "inactive",
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
  });

  it("still grants access when status is 'canceled' but period hasn't ended yet (cancel at period end)", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "canceled",
      cancel_at_period_end: true,
      current_period_end: future.toISOString(),
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("pro");
  });

  it("revokes access when 'canceled' subscription period has ended", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "canceled",
      cancel_at_period_end: true,
      current_period_end: past.toISOString(),
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
  });

  it("grants access during grace period when status is 'past_due' and period not ended", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "past_due",
      current_period_end: future.toISOString(),
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("pro");
  });

  it("revokes access when 'past_due' and period has ended", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "past_due",
      current_period_end: past.toISOString(),
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
  });

  it("grants access when active with no current_period_end (indefinite)", async () => {
    const record = makeBillingRecord({
      plan_tier: "pro",
      subscription_status: "active",
      current_period_end: null,
    });
    const supabase = makeMockSupabase(record);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("pro");
  });

  it("returns 'starter' when DB returns an error", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });
    (createAdminClient as jest.Mock).mockReturnValue({ from });

    const { plan } = await resolvePlanForUser("user_123");
    expect(plan).toBe("starter");
  });
});
