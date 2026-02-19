
import { processLemonWebhook } from "@/lib/billing/webhook-handler";
import { createAdminClient } from "@/lib/supabase/server";

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

// Mock Logger
jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Plan Resolver to avoid env var dependency issues in tests if not needed
jest.mock("@/lib/billing/plan-resolver", () => ({
  resolvePlanFromVariantId: jest.fn((id) => {
    if (id === "variant_pro_monthly") return "pro";
    if (id === "variant_pro_yearly") return "pro";
    if (id === "variant_believer") return "believer";
    return null;
  }),
}));

describe("processLemonWebhook", () => {
  let mockSupabase: any;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockSingle: jest.Mock;
  let mockFrom: jest.Mock;
  let mockUpsert: jest.Mock;
  let mockEq: jest.Mock;
  let mockMaybeSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInsert = jest.fn();
    mockSelect = jest.fn();
    mockSingle = jest.fn();
    mockUpsert = jest.fn();
    mockEq = jest.fn();
    mockMaybeSingle = jest.fn();
    mockFrom = jest.fn();

    // Chain setup
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq, maybeSingle: mockMaybeSingle });
    mockSingle.mockResolvedValue({ data: { id: 123 }, error: null });
    mockUpsert.mockReturnValue({ error: null });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    
    // Default: Return null for existing billing lookup
    mockMaybeSingle.mockResolvedValue({ data: null });

    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      upsert: mockUpsert,
      eq: mockEq,
    });

    mockSupabase = {
      from: mockFrom,
      auth: {
          admin: {
              listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null })
          }
      }
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const basePayload = {
    meta: {
      event_name: "subscription_created",
      custom_data: { user_id: "user_123" },
    },
    data: {
      id: "sub_123",
      type: "subscriptions",
      attributes: {
        store_id: 1,
        customer_id: "cust_123",
        order_id: 1,
        product_name: "Pro",
        variant_name: "Monthly",
        variant_id: "variant_pro_monthly",
        status: "active",
        billing_interval: "monthly",
        renews_at: "2026-03-01T00:00:00Z",
        ends_at: null,
        trial_ends_at: null,
        user_email: "test@example.com"
      },
    },
  };

  test("successfully processes subscription_created", async () => {
    const rawBody = JSON.stringify(basePayload);
    const result = await processLemonWebhook(rawBody);

    expect(result.processed).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("billing_webhook_events");
    expect(mockSupabase.from).toHaveBeenCalledWith("user_billing");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_123",
        plan_tier: "pro",
        subscription_status: "active",
        billing_interval: "month",
      }),
      expect.anything()
    );
  });

  test("ignores duplicates (idempotency)", async () => {
    // Mock insert error for duplicate
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "Duplicate key" },
    });

    const rawBody = JSON.stringify(basePayload);
    const result = await processLemonWebhook(rawBody);

    expect(result.processed).toBe(true);
    expect(result.ignored).toBe(true);
    // Should NOT attempt upsert if duplicate event
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test("updates status on subscription_cancelled", async () => {
    const payload = {
        ...basePayload,
        meta: { 
            ...basePayload.meta,
            event_name: "subscription_cancelled" 
        },
        data: {
            ...basePayload.data,
            attributes: {
                ...basePayload.data.attributes,
                status: "active", // Lemon sends active until period end
                cancel_at_period_end: true,
            }
        }
    };
    
    const rawBody = JSON.stringify(payload);
    await processLemonWebhook(rawBody);

    expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
            subscription_status: "active",
            cancel_at_period_end: true
        }),
        expect.anything()
    );
  });

  test("revokes access on subscription_expired", async () => {
    const payload = {
        ...basePayload,
        meta: { 
            ...basePayload.meta,
            event_name: "subscription_expired" 
        },
        data: {
            ...basePayload.data,
            attributes: {
                ...basePayload.data.attributes,
                status: "expired",
            }
        }
    };
    
    const rawBody = JSON.stringify(payload);
    await processLemonWebhook(rawBody);

    expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
            subscription_status: "expired",
        }),
        expect.anything()
    );
  });
  
  test("uses safety net email lookup if user_id missing", async () => {
      // Remove user_id from custom_data
      const payload = JSON.parse(JSON.stringify(basePayload));
      delete payload.meta.custom_data.user_id; 
      
      // Mock existing billing lookup failure
      mockMaybeSingle.mockResolvedValueOnce({ data: null }); // lookupBillingByLemonIds
      
      // Mock listUsers success
      mockSupabase.auth.admin.listUsers.mockResolvedValueOnce({
          data: { users: [{ id: "found_user_via_email", email: "test@example.com" }] },
          error: null
      });

      const rawBody = JSON.stringify(payload);
      await processLemonWebhook(rawBody);
      
      expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
              user_id: "found_user_via_email"
          }),
          expect.anything()
      );
  });

  test("activates Believer plan on order_created", async () => {
    // Mock resolvePlanFromVariantId to return 'believer' for this specific variant
    const { resolvePlanFromVariantId } = require("@/lib/billing/plan-resolver");
    resolvePlanFromVariantId.mockImplementation((id: string) => {
        if (id === "variant_believer") return "believer";
        return null;
    });

    const payload = {
        meta: { 
            event_name: "order_created",
            custom_data: { user_id: "user_believer" }
        },
        data: {
            id: "order_123",
            type: "orders",
            attributes: {
                status: "paid",
                total: 10000,
                first_order_item: {
                    variant_id: "variant_believer",
                    product_name: "Cadie Pro (Believer)"
                },
                // Intentionally omitting top-level variant_id to simulate actual payload
            }
        }
    };

    const rawBody = JSON.stringify(payload);
    await processLemonWebhook(rawBody);

    expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
            user_id: "user_believer",
            plan_tier: "believer",
            subscription_status: "active",
            billing_interval: "year",
        }),
        expect.anything()
    );
    
    // Check that current_period_end is approximately 1 year from now (not 2099)
    const upsertCall = mockUpsert.mock.calls[0][0];
    const expiryDate = new Date(upsertCall.current_period_end);
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);
    
    // Allow small delta (e.g. 10 seconds)
    const diff = Math.abs(expiryDate.getTime() - nextYear.getTime());
    expect(diff).toBeLessThan(10000); // 10s tolerance
  });
});
