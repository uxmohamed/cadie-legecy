const mockCreateClient = jest.fn();
const mockSyncSubscription = jest.fn();
const mockRateLimitBillingLimit = jest.fn();

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

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

jest.mock("@/lib/billing/sync", () => ({
  syncSubscription: (...args: unknown[]) => mockSyncSubscription(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimitBilling: {
    limit: (...args: unknown[]) => mockRateLimitBillingLimit(...args),
  },
  getIdentifier: jest.fn(() => "user:user_1"),
  getRateLimitHeaders: jest.fn(() => ({ "X-RateLimit-Limit": "20" })),
}));

import { POST } from "@/app/api/billing/sync/route";

function makeRequest() {
  return {
    headers: new Headers(),
  };
}

describe("POST /api/billing/sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitBillingLimit.mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60_000,
    });
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user_1", email: "user@example.com" } },
        }),
      },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const response = await POST(makeRequest() as never);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 429 when billing rate limit is exceeded", async () => {
    mockRateLimitBillingLimit.mockResolvedValueOnce({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(makeRequest() as never);
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many billing requests. Please try again shortly.",
    });
    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });

  it("returns sync result on success", async () => {
    mockSyncSubscription.mockResolvedValue({
      synced: true,
      source: "local_subscription_id",
    });

    const response = await POST(makeRequest() as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      synced: true,
      source: "local_subscription_id",
    });
    expect(mockSyncSubscription).toHaveBeenCalledWith("user_1", "user@example.com");
  });

  it("returns 500 when sync throws", async () => {
    mockSyncSubscription.mockRejectedValue(new Error("boom"));

    const response = await POST(makeRequest() as never);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to sync subscription",
    });
  });
});
