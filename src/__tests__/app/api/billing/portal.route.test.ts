const mockGetUserBillingRecord = jest.fn();
const mockGetCustomerPortalUrl = jest.fn();
const mockSyncSubscription = jest.fn();

jest.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;
    private readonly bodyData: unknown;

    constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.bodyData = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), {
        status: init?.status,
        headers: {
          ...(init?.headers || {}),
          "content-type": "application/json",
        },
      });
    }

    async json() {
      if (typeof this.bodyData === "string") {
        return JSON.parse(this.bodyData);
      }
      return this.bodyData;
    }
  }

  return {
    NextResponse: MockNextResponse,
  };
});

jest.mock("@/lib/billing/plan-resolver", () => ({
  getUserBillingRecord: (...args: unknown[]) => mockGetUserBillingRecord(...args),
}));

jest.mock("@/lib/billing/lemon-client", () => ({
  getCustomerPortalUrl: (...args: unknown[]) => mockGetCustomerPortalUrl(...args),
}));

jest.mock("@/lib/billing/sync", () => ({
  syncSubscription: (...args: unknown[]) => mockSyncSubscription(...args),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/billing/portal/route";

describe("POST /api/billing/portal", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user_1", email: "user@example.com" } },
        }),
      },
    } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns portal URL when subscription ID already exists", async () => {
    mockGetUserBillingRecord.mockResolvedValue({ lemon_subscription_id: "sub_123" });
    mockGetCustomerPortalUrl.mockResolvedValue({ portalUrl: "https://portal.example/sub_123" });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ portal_url: "https://portal.example/sub_123" });
    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });

  it("auto-recovers missing subscription ID and opens portal", async () => {
    mockGetUserBillingRecord
      .mockResolvedValueOnce({ lemon_subscription_id: null })
      .mockResolvedValueOnce({ lemon_subscription_id: "sub_new" });
    mockSyncSubscription.mockResolvedValue({ synced: true, source: "email_bootstrap" });
    mockGetCustomerPortalUrl.mockResolvedValue({ portalUrl: "https://portal.example/sub_new" });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ portal_url: "https://portal.example/sub_new" });
    expect(mockSyncSubscription).toHaveBeenCalledWith("user_1", "user@example.com");
  });

  it("returns 409 when no active Lemon subscription can be matched", async () => {
    mockGetUserBillingRecord
      .mockResolvedValueOnce({ lemon_subscription_id: null })
      .mockResolvedValueOnce({ lemon_subscription_id: null });
    mockSyncSubscription.mockResolvedValue({
      synced: false,
      source: "none",
      reason: "no_matching_subscription",
      message: "No matching active subscription found for this account",
    });

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "No active Lemon subscription could be matched for this account",
      recoverable: true,
      sync_attempted: true,
      reason: "no_matching_subscription",
    });
  });

  it("retries once when stored subscription ID is stale and succeeds after sync", async () => {
    mockGetUserBillingRecord
      .mockResolvedValueOnce({ lemon_subscription_id: "sub_old" })
      .mockResolvedValueOnce({ lemon_subscription_id: "sub_new" });
    mockGetCustomerPortalUrl
      .mockRejectedValueOnce(new Error("subscription not found"))
      .mockResolvedValueOnce({ portalUrl: "https://portal.example/sub_new" });
    mockSyncSubscription.mockResolvedValue({ synced: true, source: "customer_bootstrap" });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ portal_url: "https://portal.example/sub_new" });
    expect(mockGetCustomerPortalUrl).toHaveBeenNthCalledWith(1, "sub_old");
    expect(mockGetCustomerPortalUrl).toHaveBeenNthCalledWith(2, "sub_new");
    expect(mockSyncSubscription).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on unexpected sync failure", async () => {
    mockGetUserBillingRecord.mockResolvedValue({ lemon_subscription_id: null });
    mockSyncSubscription.mockRejectedValue(new Error("sync crashed"));

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to open billing portal. Please try again in a moment.",
    });
  });
});
