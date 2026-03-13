const mockCreateRequestContext = jest.fn();
const mockRateLimitSpacesLimit = jest.fn();
const mockGetLinkContext = jest.fn();

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

jest.mock("@/lib/rate-limit", () => ({
  rateLimitSpaces: {
    limit: (...args: unknown[]) => mockRateLimitSpacesLimit(...args),
  },
  getIdentifier: jest.fn(() => "user:user_1"),
  getRateLimitHeaders: jest.fn(() => ({ "X-RateLimit-Limit": "30" })),
}));

jest.mock("@/lib/request-data", () => ({
  RequestDataAccess: jest.fn().mockImplementation(() => ({
    getLinkContext: (...args: unknown[]) => mockGetLinkContext(...args),
  })),
  RequestDataAccessError: class RequestDataAccessError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { GET } from "@/app/api/extension/link-context/route";

describe("GET /api/extension/link-context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRequestContext.mockResolvedValue({
      userId: "user_1",
      authSource: "api_token",
      token: {
        id: "token_1",
        expiresAt: "2099-01-01T00:00:00Z",
        scopes: ["legacy_full_access"],
        clientId: "cadie-browser-extension",
        installId: "install_1",
      },
    });
    mockRateLimitSpacesLimit.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it("returns spaces and selected space IDs for a link", async () => {
    mockGetLinkContext.mockResolvedValue({
      spaces: [
        { id: "s1", name: "Work", color: "#111111" },
        { id: "s2", name: "Personal", color: "#222222" },
      ],
      selectedSpaceIds: ["s2"],
    });

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
    expect(mockGetLinkContext).toHaveBeenCalledWith("3fa85f64-5717-4562-b3fc-2c963f66afa6");
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
