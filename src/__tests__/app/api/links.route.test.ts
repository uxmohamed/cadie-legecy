const mockCreateRequestContext = jest.fn();
const mockRateLimitLinksLimit = jest.fn();
const mockGetIdentifier = jest.fn();
const mockGetRateLimitHeaders = jest.fn();
const mockValidateRequestBody = jest.fn();
const mockGetLinksHandle = jest.fn();
const mockCreateLinkHandle = jest.fn();

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
  rateLimitLinks: {
    limit: (...args: unknown[]) => mockRateLimitLinksLimit(...args),
  },
  getIdentifier: (...args: unknown[]) => mockGetIdentifier(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

jest.mock("@/lib/validation/validate", () => ({
  validateRequestBody: (...args: unknown[]) => mockValidateRequestBody(...args),
}));

jest.mock("@/features/links/api/handlers", () => ({
  GetLinksHandler: jest.fn().mockImplementation(() => ({
    handle: (...args: unknown[]) => mockGetLinksHandle(...args),
  })),
  CreateLinkHandler: jest.fn().mockImplementation(() => ({
    handle: (...args: unknown[]) => mockCreateLinkHandle(...args),
  })),
}));

import { GET, POST } from "@/app/api/links/route";

describe("/api/links route auth and rate-limit order", () => {
  const sessionContext = {
    userId: "user_1",
    authSource: "session" as const,
    token: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRequestContext.mockResolvedValue(sessionContext);
    mockGetIdentifier.mockReturnValue("user:user_1");
    mockGetRateLimitHeaders.mockReturnValue({
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": "99",
      "X-RateLimit-Reset": "123",
    });
    mockRateLimitLinksLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 123,
    });
  });

  it("GET returns 401 before rate limiting when unauthenticated", async () => {
    mockCreateRequestContext.mockResolvedValue(null);

    const response = await GET({
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/links"),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockRateLimitLinksLimit).not.toHaveBeenCalled();
    expect(mockGetIdentifier).not.toHaveBeenCalled();
    expect(mockGetLinksHandle).not.toHaveBeenCalled();
  });

  it("POST returns 401 before rate limiting when unauthenticated", async () => {
    mockCreateRequestContext.mockResolvedValue(null);

    const response = await POST({
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({
        url: "https://example.com",
        title: "Example",
      }),
      nextUrl: new URL("http://localhost/api/links"),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockRateLimitLinksLimit).not.toHaveBeenCalled();
    expect(mockGetIdentifier).not.toHaveBeenCalled();
    expect(mockValidateRequestBody).not.toHaveBeenCalled();
    expect(mockCreateLinkHandle).not.toHaveBeenCalled();
  });

  it("GET applies rate limiting for authenticated user and passes user id to handler", async () => {
    mockGetLinksHandle.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      json: async () => ({ links: [] }),
    });

    const request = {
      headers: new Headers(),
      nextUrl: new URL("http://localhost/api/links"),
    } as never;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetIdentifier).toHaveBeenCalledWith(request, "user_1");
    expect(mockRateLimitLinksLimit).toHaveBeenCalledWith("user:user_1");
    expect(mockGetLinksHandle).toHaveBeenCalledWith(request, "user_1");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("POST applies rate limiting for authenticated user and passes request context to handler", async () => {
    mockValidateRequestBody.mockResolvedValue({
      data: {
        url: "https://example.com",
        title: "Example",
        content_type: "url",
      },
      error: null,
    });
    mockCreateLinkHandle.mockResolvedValue({
      status: 201,
      headers: new Headers(),
      json: async () => ({ id: "link_1" }),
    });

    const request = {
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({
        url: "https://example.com",
        title: "Example",
      }),
      nextUrl: new URL("http://localhost/api/links"),
    } as never;

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockGetIdentifier).toHaveBeenCalledWith(request, "user_1");
    expect(mockRateLimitLinksLimit).toHaveBeenCalledWith("user:user_1");
    expect(mockCreateLinkHandle).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        url: "https://example.com",
        title: "Example",
        og_image_url: null,
        favicon_url: null,
        description: null,
        color_value: null,
      }),
      sessionContext
    );
  });
});
