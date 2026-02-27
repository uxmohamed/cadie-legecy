const mockRateLimitAccountDeletionLimit = jest.fn();
const mockGetIdentifier = jest.fn();
const mockGetRateLimitHeaders = jest.fn();

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

jest.mock("@/lib/rate-limit", () => ({
  rateLimitAccountDeletion: {
    limit: (...args: unknown[]) => mockRateLimitAccountDeletionLimit(...args),
  },
  getIdentifier: (...args: unknown[]) => mockGetIdentifier(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { DELETE } from "@/app/api/auth/delete-account/route";

describe("DELETE /api/auth/delete-account", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIdentifier.mockReturnValue("user:user_1");
    mockGetRateLimitHeaders.mockReturnValue({
      "X-RateLimit-Limit": "3",
      "X-RateLimit-Remaining": "2",
      "X-RateLimit-Reset": "123",
      "Retry-After": "10",
    });
    mockRateLimitAccountDeletionLimit.mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 60_000,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const response = await DELETE({ headers: new Headers() } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("deletes user-owned data using users table and then deletes auth user", async () => {
    const tablesTouched: string[] = [];
    const deleteUser = jest.fn().mockResolvedValue({ error: null });

    const from = jest.fn((table: string) => {
      tablesTouched.push(table);

      const eq = jest.fn().mockResolvedValue({ error: null });
      const inFilter = jest.fn().mockResolvedValue({ error: null });

      if (table === "links") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: "link_1" }, { id: "link_2" }],
              error: null,
            }),
          }),
          delete: jest.fn().mockReturnValue({ eq }),
        };
      }

      return {
        delete: jest.fn().mockReturnValue({ eq, in: inFilter }),
      };
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_1" } } }),
      },
    } as never);
    mockCreateAdminClient.mockReturnValue({
      from,
      auth: {
        admin: {
          deleteUser,
        },
      },
    } as never);

    const response = await DELETE({ headers: new Headers() } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(deleteUser).toHaveBeenCalledWith("user_1");
    expect(tablesTouched).toContain("users");
    expect(tablesTouched).not.toContain("profiles");
    expect(tablesTouched).toEqual(
      expect.arrayContaining([
        "links",
        "link_spaces",
        "link_tags",
        "spaces",
        "api_tokens",
        "user_billing",
        "bookmark_import_jobs",
        "users",
      ])
    );
  });

  it("returns 500 and does not delete auth user when data cleanup fails", async () => {
    const deleteUser = jest.fn().mockResolvedValue({ error: null });

    const from = jest.fn((table: string) => {
      const eq = jest
        .fn()
        .mockResolvedValue(table === "users" ? { error: { message: "relation does not exist" } } : { error: null });

      const inFilter = jest.fn().mockResolvedValue({ error: null });

      if (table === "links") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: "link_1" }],
              error: null,
            }),
          }),
          delete: jest.fn().mockReturnValue({ eq }),
        };
      }

      return {
        delete: jest.fn().mockReturnValue({ eq, in: inFilter }),
      };
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_1" } } }),
      },
    } as never);
    mockCreateAdminClient.mockReturnValue({
      from,
      auth: {
        admin: {
          deleteUser,
        },
      },
    } as never);

    const response = await DELETE({ headers: new Headers() } as never);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to delete account" });
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
