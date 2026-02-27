const mockAuthenticateRequest = jest.fn();
const mockRateLimitSpacesLimit = jest.fn();
const mockCreateDataClientForRequest = jest.fn();

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

jest.mock("@/lib/supabase/server", () => ({
  createDataClientForRequest: (...args: unknown[]) => mockCreateDataClientForRequest(...args),
}));

import { GET } from "@/app/api/spaces/route";

describe("GET /api/spaces", () => {
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

  it("returns lightweight spaces when lite=1", async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: "s1", name: "Work", color: "#000000" }],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockImplementation((table: string) => {
      expect(table).toBe("spaces");
      return { select };
    });

    mockCreateDataClientForRequest.mockResolvedValue({ from } as never);

    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/spaces?lite=1"),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      spaces: [{ id: "s1", name: "Work", color: "#000000" }],
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockAuthenticateRequest.mockResolvedValueOnce(null);

    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/spaces?lite=1"),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
