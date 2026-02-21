import { syncSubscription } from "@/lib/billing/sync";
import { createAdminClient } from "@/lib/supabase/server";
import { lemonRequest } from "@/lib/billing/lemon-client";
import { getUserBillingRecord, resolvePlanFromVariantId } from "@/lib/billing/plan-resolver";

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/lib/billing/lemon-client", () => ({
  lemonRequest: jest.fn(),
}));

jest.mock("@/lib/billing/plan-resolver", () => ({
  getUserBillingRecord: jest.fn(),
  resolvePlanFromVariantId: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("syncSubscription", () => {
  let mockSupabase: {
    from: jest.Mock;
  };
  let mockUpsert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpsert = jest.fn().mockResolvedValue({ error: null });
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
    (resolvePlanFromVariantId as jest.Mock).mockReturnValue("pro");
  });

  test("syncs using local subscription id when available", async () => {
    (getUserBillingRecord as jest.Mock).mockResolvedValue({
      user_id: "user_123",
      plan_tier: "pro",
      lemon_subscription_id: "sub_123",
    });

    (lemonRequest as jest.Mock).mockResolvedValue({
      data: {
        id: "sub_123",
        attributes: {
          variant_id: "1320194",
          status: "active",
          renews_at: "2026-05-01T00:00:00Z",
          billing_interval: "monthly",
          customer_id: "7861817",
        },
      },
    });

    const result = await syncSubscription("user_123", "test@example.com");

    expect(result).toEqual({
      synced: true,
      source: "local_subscription_id",
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_123",
        lemon_subscription_id: "sub_123",
        plan_tier: "pro",
        subscription_status: "active",
      }),
      { onConflict: "user_id" }
    );
  });

  test("returns no_user_email when bootstrap is needed but email is missing", async () => {
    (getUserBillingRecord as jest.Mock).mockResolvedValue({
      user_id: "user_123",
      plan_tier: "starter",
      lemon_subscription_id: null,
    });

    const result = await syncSubscription("user_123", null);

    expect(result).toEqual({
      synced: false,
      source: "none",
      reason: "no_user_email",
      message: "No user email available for billing bootstrap",
    });
  });

  test("bootstraps from subscription lookup by email", async () => {
    (getUserBillingRecord as jest.Mock).mockResolvedValue({
      user_id: "user_123",
      plan_tier: "starter",
      lemon_subscription_id: null,
    });

    (lemonRequest as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          id: "sub_new",
          attributes: {
            variant_id: "1320194",
            status: "active",
            renews_at: "2026-05-15T00:00:00Z",
            billing_interval: "monthly",
            customer_id: "7861817",
            updated_at: "2026-02-21T22:31:45Z",
          },
        },
      ],
    });

    const result = await syncSubscription("user_123", "mo73426+2@gmail.com");

    expect(lemonRequest).toHaveBeenCalledWith(
      "/subscriptions?filter[user_email]=mo73426%2B2%40gmail.com&page[size]=100"
    );
    expect(result).toEqual({
      synced: true,
      source: "email_bootstrap",
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        lemon_subscription_id: "sub_new",
      }),
      { onConflict: "user_id" }
    );
  });

  test("falls back to customer lookup when email subscription lookup is empty", async () => {
    (getUserBillingRecord as jest.Mock).mockResolvedValue({
      user_id: "user_123",
      plan_tier: "starter",
      lemon_subscription_id: null,
    });

    (lemonRequest as jest.Mock)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [{ id: "7861817" }],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "sub_customer",
            attributes: {
              variant_id: "1320194",
              status: "active",
              renews_at: "2026-05-15T00:00:00Z",
              customer_id: "7861817",
              updated_at: "2026-02-21T22:32:45Z",
            },
          },
        ],
      });

    const result = await syncSubscription("user_123", "mo73426+2@gmail.com");

    expect(lemonRequest).toHaveBeenNthCalledWith(
      2,
      "/customers?filter[email]=mo73426%2B2%40gmail.com&page[size]=100"
    );
    expect(lemonRequest).toHaveBeenNthCalledWith(
      3,
      "/subscriptions?filter[customer_id]=7861817&page[size]=100"
    );
    expect(result).toEqual({
      synced: true,
      source: "customer_bootstrap",
    });
  });

  test("returns unmapped_variant when no variant mapping is found", async () => {
    (resolvePlanFromVariantId as jest.Mock).mockReturnValue(null);
    (getUserBillingRecord as jest.Mock).mockResolvedValue({
      user_id: "user_123",
      plan_tier: "starter",
      lemon_subscription_id: "sub_123",
    });
    (lemonRequest as jest.Mock).mockResolvedValue({
      data: {
        id: "sub_123",
        attributes: {
          variant_id: "unknown_variant",
          status: "active",
          renews_at: "2026-05-01T00:00:00Z",
        },
      },
    });

    const result = await syncSubscription("user_123", "test@example.com");

    expect(result).toEqual({
      synced: false,
      source: "none",
      reason: "unmapped_variant",
      message: "Subscription found but variant is not mapped to an app plan",
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test("returns no_local_subscription when no matching subscription can be found", async () => {
    (getUserBillingRecord as jest.Mock).mockResolvedValue({
      user_id: "user_123",
      plan_tier: "starter",
      lemon_subscription_id: null,
    });

    (lemonRequest as jest.Mock)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    const result = await syncSubscription("user_123", "test@example.com");

    expect(result).toEqual({
      synced: false,
      source: "none",
      reason: "no_local_subscription",
      message: "No matching active subscription found for this account",
    });
  });
});
