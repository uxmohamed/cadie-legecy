
import { syncSubscription } from "@/lib/billing/sync";
import { createAdminClient } from "@/lib/supabase/server";
import { lemonRequest } from "@/lib/billing/lemon-client";

// Mock dependencies
jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/lib/billing/lemon-client", () => ({
  lemonRequest: jest.fn(),
}));

// Mock Logger
jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/billing/plan-resolver", () => ({
    getUserBillingRecord: jest.fn(),
    resolvePlanFromVariantId: jest.fn(() => "pro"),
}));
import { getUserBillingRecord } from "@/lib/billing/plan-resolver";

describe("syncSubscription", () => {
    let mockSupabase: any;
    let mockUpdate: jest.Mock;
    let mockEq: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdate = jest.fn();
        mockEq = jest.fn();
        mockUpdate.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ error: null });

        mockSupabase = {
            from: jest.fn().mockReturnValue({
                update: mockUpdate
            })
        };
        (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    test("fails if no local subscription ID", async () => {
        (getUserBillingRecord as jest.Mock).mockResolvedValue({ lemon_subscription_id: null });
        const result = await syncSubscription("user_123");
        expect(result.synced).toBe(false);
        expect(result.message).toContain("No active subscription ID found");
    });

    test("successfully syncs active subscription", async () => {
        (getUserBillingRecord as jest.Mock).mockResolvedValue({ 
            lemon_subscription_id: "sub_123",
            user_id: "user_123",
            plan_tier: "pro"
        });

        (lemonRequest as jest.Mock).mockResolvedValue({
            data: {
                attributes: {
                    variant_id: "123",
                    status: "active",
                    renews_at: "2026-05-01T00:00:00Z",
                    billing_interval: "monthly",
                    cancel_at_period_end: false
                }
            }
        });

        const result = await syncSubscription("user_123");
        
        expect(result.synced).toBe(true);
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                subscription_status: "active",
                current_period_end: "2026-05-01T00:00:00.000Z"
            })
        );
    });

    test("syncs failed/past_due status", async () => {
        (getUserBillingRecord as jest.Mock).mockResolvedValue({ 
            lemon_subscription_id: "sub_123",
             user_id: "user_123",
        });

        (lemonRequest as jest.Mock).mockResolvedValue({
            data: {
                attributes: {
                    status: "past_due",
                    renews_at: null,
                    billing_interval: "monthly"
                }
            }
        });

        const result = await syncSubscription("user_123");
        
        expect(result.synced).toBe(true);
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                subscription_status: "past_due",
            })
        );
    });
});
