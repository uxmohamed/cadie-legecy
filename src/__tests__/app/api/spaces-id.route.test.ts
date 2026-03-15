const mockCreateRequestContext = jest.fn();
const mockRateLimitSpacesLimit = jest.fn();
const mockCreateClient = jest.fn();
const mockGetBillingContext = jest.fn();
const mockCreatePlanLimitResponse = jest.fn();
const mockRequireTokenScopes = jest.fn();

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

jest.mock("@/lib/auth-middleware", () => ({
  createRequestContext: (...args: unknown[]) => mockCreateRequestContext(...args),
}));

jest.mock("@/lib/api-tokens", () => ({
  requireTokenScopes: (...args: unknown[]) => mockRequireTokenScopes(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimitSpaces: {
    limit: (...args: unknown[]) => mockRateLimitSpacesLimit(...args),
  },
  getIdentifier: jest.fn(() => "user:user_1"),
  getRateLimitHeaders: jest.fn(() => ({ "X-RateLimit-Limit": "30" })),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

jest.mock("@/lib/billing/context", () => ({
  getBillingContext: (...args: unknown[]) => mockGetBillingContext(...args),
}));

jest.mock("@/lib/billing/limit-response", () => ({
  createPlanLimitResponse: (...args: unknown[]) => mockCreatePlanLimitResponse(...args),
}));

import { PATCH } from "@/app/api/spaces/[id]/route";

describe("PATCH /api/spaces/[id] billing lock behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRequestContext.mockResolvedValue({ userId: "user_1", authSource: "session", token: null });
    mockRequireTokenScopes.mockReturnValue(null);
    mockRateLimitSpacesLimit.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    mockCreatePlanLimitResponse.mockImplementation(() =>
      ({
        status: 402,
        headers: new Headers(),
        json: async () => ({ error: "plan limit" }),
      }) as never
    );
  });

  it("blocks sort_order updates when user is over space limit", async () => {
    const update = jest.fn();
    const selectChain = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: "space_a" }, error: null }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table !== "spaces") throw new Error(`Unexpected table: ${table}`);
        return {
          select: jest.fn().mockReturnValue(selectChain),
          update,
        };
      }),
    });

    mockGetBillingContext.mockResolvedValue({
      plan: "starter",
      entitlements: { maxSpaces: 3 },
      usage: { spacesTotal: 4 },
      lockedSpaceIds: new Set(["space_d"]),
    });

    const response = await PATCH(
      {
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ sort_order: 99 }),
      } as never,
      { params: Promise.resolve({ id: "space_a" }) }
    );

    expect(response.status).toBe(402);
    expect(mockCreatePlanLimitResponse).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it("allows non-sort updates for unlocked spaces even when over space limit", async () => {
    const updateSingle = jest.fn().mockResolvedValue({
      data: { id: "space_a", name: "Renamed", description: null },
      error: null,
    });
    const updateChain = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: updateSingle,
          }),
        }),
      }),
    };
    const selectChain = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: "space_a" }, error: null }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table !== "spaces") throw new Error(`Unexpected table: ${table}`);
        return {
          select: jest.fn().mockReturnValue(selectChain),
          update: jest.fn().mockReturnValue(updateChain),
        };
      }),
    });

    mockGetBillingContext.mockResolvedValue({
      plan: "starter",
      entitlements: { maxSpaces: 3 },
      usage: { spacesTotal: 4 },
      lockedSpaceIds: new Set(["space_d"]),
    });

    const response = await PATCH(
      {
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ name: "Renamed" }),
      } as never,
      { params: Promise.resolve({ id: "space_a" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      space: { id: "space_a", name: "Renamed", description: null },
    });
    expect(mockCreatePlanLimitResponse).not.toHaveBeenCalled();
  });
});
