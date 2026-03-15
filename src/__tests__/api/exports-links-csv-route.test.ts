const mockCreateRequestContext = jest.fn();
const mockRateLimit = jest.fn();
const mockGetIdentifier = jest.fn();
const mockGetRateLimitHeaders = jest.fn();
const mockStreamActiveLinksCsv = jest.fn();
const mockCreateExportFilename = jest.fn();
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
      const headers = {
        ...(init?.headers || {}),
        "content-type": "application/json",
      };
      return new MockNextResponse(JSON.stringify(data), {
        status: init?.status,
        headers,
      });
    }

    async json() {
      if (typeof this.bodyData === "string") {
        return JSON.parse(this.bodyData);
      }
      return this.bodyData;
    }

    async text() {
      if (typeof this.bodyData === "string") {
        return this.bodyData;
      }

      if (
        this.bodyData &&
        typeof this.bodyData === "object" &&
        "getReader" in this.bodyData &&
        typeof (this.bodyData as ReadableStream<Uint8Array>).getReader === "function"
      ) {
        const reader = (this.bodyData as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        let output = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          output += decoder.decode(value, { stream: true });
        }
        output += decoder.decode();
        return output;
      }

      return String(this.bodyData ?? "");
    }
  }

  return {
    NextRequest: class MockNextRequest {},
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
  rateLimitExports: {
    limit: (...args: unknown[]) => mockRateLimit(...args),
  },
  getIdentifier: (...args: unknown[]) => mockGetIdentifier(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

jest.mock("@/features/exports/services/link-export.service", () => ({
  LinkExportService: jest.fn().mockImplementation(() => ({
    streamActiveLinksCsv: (...args: unknown[]) => mockStreamActiveLinksCsv(...args),
  })),
  createExportFilename: (...args: unknown[]) => mockCreateExportFilename(...args),
}));

import { GET } from "@/app/api/exports/links/csv/route";

describe("GET /api/exports/links/csv", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTokenScopes.mockReturnValue(null);
    mockGetIdentifier.mockReturnValue("user:test-user");
    mockGetRateLimitHeaders.mockReturnValue({
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": "9",
      "X-RateLimit-Reset": "123",
      "Retry-After": "10",
    });
    mockCreateExportFilename.mockReturnValue("cadie-links-active-20260217-220000.csv");
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateRequestContext.mockResolvedValue(null);

    const request = { headers: new Headers() } as never;
    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 429 when rate limited", async () => {
    mockCreateRequestContext.mockResolvedValue({ userId: "test-user", authSource: "session", token: null });
    mockRateLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123,
    });

    const request = { headers: new Headers() } as never;
    const response = await GET(request);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests. Please try again later.",
    });
  });

  it("returns CSV stream with expected headers for authenticated requests", async () => {
    mockCreateRequestContext.mockResolvedValue({ userId: "test-user", authSource: "session", token: null });
    mockRateLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 123,
    });

    async function* stream() {
      yield "\uFEFFid,title\r\n";
      yield "1,Example\r\n";
    }

    mockStreamActiveLinksCsv.mockReturnValue(stream());

    const request = { headers: new Headers() } as never;
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toContain(
      'filename="cadie-links-active-20260217-220000.csv"'
    );

    const body = await response.text();
    expect(body).toContain("id,title");
    expect(body).toContain("Example");
  });
});
