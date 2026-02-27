const mockCreateClient = jest.fn();
const mockRateLimitPermanentDeleteLimit = jest.fn();
const mockRateLimitLinksLimit = jest.fn();
const mockGetIdentifier = jest.fn();
const mockGetRateLimitHeaders = jest.fn();
const mockValidateUUID = jest.fn();
const mockValidateRequestBody = jest.fn();

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
    NextRequest: class MockNextRequest {},
    after: jest.fn(),
  };
});

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimitPermanentDelete: {
    limit: (...args: unknown[]) => mockRateLimitPermanentDeleteLimit(...args),
  },
  rateLimitLinks: {
    limit: (...args: unknown[]) => mockRateLimitLinksLimit(...args),
  },
  getIdentifier: (...args: unknown[]) => mockGetIdentifier(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

jest.mock("@/lib/validation/validate", () => ({
  validateUUID: (...args: unknown[]) => mockValidateUUID(...args),
  validateRequestBody: (...args: unknown[]) => mockValidateRequestBody(...args),
}));

jest.mock("@/lib/retry", () => ({
  withRetry: async (fn: () => Promise<unknown>) => fn(),
  supabaseRetryPredicate: jest.fn(),
}));

jest.mock("@/lib/canonicalize", () => ({
  canonicalizeUrl: (url: string) => url,
  resolveColorMetadata: jest.fn(),
}));

jest.mock("@/lib/job-queue", () => ({
  enqueueBatchMetadataEnrichment: jest.fn(),
  enqueueBatchAITagging: jest.fn(),
  enqueueBatchAIVisionTagging: jest.fn(),
}));

jest.mock("@/features/spaces/services/auto-space-forwarding.service", () => ({
  AutoSpaceForwardingService: jest.fn().mockImplementation(() => ({
    processBatch: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@/lib/billing/context", () => ({
  getBillingContext: jest.fn(),
}));

jest.mock("@/lib/billing/limit-response", () => ({
  createPlanLimitResponse: jest.fn(),
}));

jest.mock("@/lib/validation/link.schemas", () => ({
  batchActionSchema: {},
}));

jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { DELETE as deletePermanent } from "@/app/api/links/[id]/permanent/route";
import { POST as batchPost } from "@/app/api/links/batch/route";

describe("permanent delete guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIdentifier.mockReturnValue("user:user_1");
    mockGetRateLimitHeaders.mockReturnValue({});
    mockRateLimitPermanentDeleteLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    mockRateLimitLinksLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    });
    mockValidateUUID.mockReturnValue(null);
    mockValidateRequestBody.mockResolvedValue({
      data: { action: "permanent_delete", ids: ["11111111-1111-4111-8111-111111111111"] },
      error: null,
    });
  });

  it("single-item permanent delete only targets trashed links", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const deleteBuilder = {
      eq: jest.fn((field: string, value: unknown) => {
        eqCalls.push([field, value]);
        if (eqCalls.length === 3) {
          return Promise.resolve({ error: null });
        }
        return deleteBuilder;
      }),
    };

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_1" } } }),
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table !== "links") throw new Error(`Unexpected table: ${table}`);
        return {
          delete: jest.fn().mockReturnValue(deleteBuilder),
        };
      }),
    });

    const response = await deletePermanent(
      { headers: new Headers() } as never,
      { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(eqCalls).toEqual([
      ["id", "11111111-1111-4111-8111-111111111111"],
      ["user_id", "user_1"],
      ["is_deleted", true],
    ]);
  });

  it("batch permanent delete only targets trashed links", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const deleteBuilder = {
      eq: jest.fn((field: string, value: unknown) => {
        eqCalls.push([field, value]);
        return deleteBuilder;
      }),
      in: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: "11111111-1111-4111-8111-111111111111" }],
          error: null,
        }),
      }),
    };

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_1" } } }),
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table !== "links") throw new Error(`Unexpected table: ${table}`);
        return {
          delete: jest.fn().mockReturnValue(deleteBuilder),
        };
      }),
    });

    const response = await batchPost({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/links/batch"),
    } as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        action: "permanent_delete",
        count: 1,
        requested: 1,
      })
    );
    expect(eqCalls).toEqual([
      ["user_id", "user_1"],
      ["is_deleted", true],
    ]);
  });
});
