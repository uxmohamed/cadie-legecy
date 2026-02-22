const mockCreateAdminClient = jest.fn();
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

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));

jest.mock("@/lib/billing/sync", () => ({
  syncSubscription: (...args: unknown[]) => mockSyncSubscription(...args),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { GET } from "@/app/api/cron/billing-reconcile/route";

function makeRequest(url: string, authHeader?: string) {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return {
    headers,
    nextUrl: new URL(url),
  };
}

function createSupabaseMock(args: {
  billingRows?: Array<Record<string, unknown>>;
  users?: Array<{ id: string; email: string | null }>;
  billingError?: { message: string } | null;
  usersError?: { message: string } | null;
}) {
  const billingRows = args.billingRows || [];
  const users = args.users || [];

  return {
    from(table: string) {
      if (table === "user_billing") {
        return {
          select() {
            return {
              or() {
                return {
                  async limit() {
                    return {
                      data: billingRows,
                      error: args.billingError || null,
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "users") {
        return {
          select() {
            return {
              async in() {
                return {
                  data: users,
                  error: args.usersError || null,
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("GET /api/cron/billing-reconcile", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "cron_secret_123",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 401 for unauthorized requests", async () => {
    const response = await GET(makeRequest("https://cadie.app/api/cron/billing-reconcile") as never);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns dry-run summary without syncing", async () => {
    mockCreateAdminClient.mockReturnValue(
      createSupabaseMock({
        billingRows: [
          { user_id: "user_1", plan_tier: "pro", subscription_status: "active" },
          { user_id: "user_2", plan_tier: "believer", subscription_status: "past_due" },
        ],
        users: [
          { id: "user_1", email: "one@example.com" },
          { id: "user_2", email: "two@example.com" },
        ],
      })
    );

    const response = await GET(
      makeRequest(
        "https://cadie.app/api/cron/billing-reconcile?dry_run=true",
        "Bearer cron_secret_123"
      ) as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
        scanned: 2,
        synced: 0,
        unchanged: 0,
        failed: 0,
        dry_run: true,
      })
    );
    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });

  it("returns reconciliation summary counts", async () => {
    mockCreateAdminClient.mockReturnValue(
      createSupabaseMock({
        billingRows: [
          { user_id: "user_1", plan_tier: "pro", subscription_status: "active" },
          { user_id: "user_2", plan_tier: "pro", subscription_status: "past_due" },
          { user_id: "user_3", plan_tier: "believer", subscription_status: "canceled" },
          { user_id: "user_4", plan_tier: "pro", subscription_status: "active" },
        ],
        users: [
          { id: "user_1", email: "one@example.com" },
          { id: "user_2", email: "two@example.com" },
          { id: "user_3", email: "three@example.com" },
          { id: "user_4", email: "four@example.com" },
        ],
      })
    );

    mockSyncSubscription
      .mockResolvedValueOnce({ synced: true, source: "local_subscription_id" })
      .mockResolvedValueOnce({ synced: false, source: "none", reason: "no_mapped_candidate" })
      .mockResolvedValueOnce({ synced: false, source: "none", reason: "no_matching_subscription" })
      .mockResolvedValueOnce({ synced: false, source: "none", reason: "lemon_error" });

    const response = await GET(
      makeRequest("https://cadie.app/api/cron/billing-reconcile", "Bearer cron_secret_123") as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
        scanned: 4,
        synced: 1,
        unchanged: 2,
        failed: 1,
        unmapped: 1,
        no_email: 0,
        dry_run: false,
      })
    );
  });
});
