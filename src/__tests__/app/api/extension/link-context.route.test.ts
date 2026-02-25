const mockAuthenticateRequest = jest.fn();
const mockRateLimitSpacesLimit = jest.fn();

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
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimitSpaces: {
    limit: (...args: unknown[]) => mockRateLimitSpacesLimit(...args),
  },
  getIdentifier: jest.fn(() => "user:user_1"),
  getRateLimitHeaders: jest.fn(() => ({ "X-RateLimit-Limit": "30" })),
}));

import { createClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/extension/link-context/route";

describe("GET /api/extension/link-context", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue("user_1");
    mockRateLimitSpacesLimit.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it("returns spaces and selected space IDs for a link", async () => {
    const linksQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "link_1" },
        error: null,
      }),
    };

    const spacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: "s1", name: "Work", color: "#111111" },
          { id: "s2", name: "Personal", color: "#222222" },
        ],
        error: null,
      }),
    };

    const linkSpacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ space_id: "s2" }],
        error: null,
      }),
    };

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === "links") return linksQuery;
      if (table === "spaces") return spacesQuery;
      if (table === "link_spaces") return linkSpacesQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    mockCreateClient.mockResolvedValue({ from } as never);

    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/extension/link-context?linkId=3fa85f64-5717-4562-b3fc-2c963f66afa6"),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      spaces: [
        { id: "s1", name: "Work", color: "#111111" },
        { id: "s2", name: "Personal", color: "#222222" },
      ],
      selected_space_ids: ["s2"],
    });
  });

  it("returns 400 when linkId is missing", async () => {
    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/extension/link-context"),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "linkId is required" });
  });
});
