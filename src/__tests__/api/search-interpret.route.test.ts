import type { NextRequest } from "next/server";

const mockAuthenticateRequest = jest.fn();
const mockRateLimit = jest.fn();
const mockValidateRequestBody = jest.fn();
const mockInterpretQuery = jest.fn();

class MockHeaders {
  private values = new Map<string, string>();

  constructor(initial?: Record<string, string>) {
    Object.entries(initial || {}).forEach(([key, value]) => {
      this.values.set(key.toLowerCase(), value);
    });
  }

  set(key: string, value: string) {
    this.values.set(key.toLowerCase(), value);
  }

  get(key: string) {
    return this.values.get(key.toLowerCase()) ?? null;
  }
}

class MockNextResponse {
  status: number;
  headers: MockHeaders;
  private payload: unknown;

  constructor(payload: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    this.payload = payload;
    this.status = init?.status ?? 200;
    this.headers = new MockHeaders(init?.headers);
  }

  static json(payload: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    return new MockNextResponse(payload, init);
  }

  async json() {
    return this.payload;
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

jest.mock("@/lib/auth-middleware", () => ({
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimitSearch: {
    limit: (...args: unknown[]) => mockRateLimit(...args),
  },
  getIdentifier: () => "user:test-user",
  getRateLimitHeaders: () => ({
    "X-RateLimit-Limit": "30",
    "X-RateLimit-Remaining": "29",
    "X-RateLimit-Reset": String(Date.now() + 60000),
    "Retry-After": "60",
  }),
}));

jest.mock("@/lib/validation/validate", () => ({
  validateRequestBody: (...args: unknown[]) => mockValidateRequestBody(...args),
}));

jest.mock("@/features/search/services/query-interpreter.service", () => ({
  QueryInterpreterService: jest.fn().mockImplementation(() => ({
    interpretQuery: (...args: unknown[]) => mockInterpretQuery(...args),
  })),
}));

import { POST } from "@/app/api/search/interpret/route";

describe("POST /api/search/interpret", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue("test-user-id");
    mockRateLimit.mockResolvedValue({ success: true, limit: 30, reset: Date.now() + 60000, remaining: 29 });
    mockValidateRequestBody.mockResolvedValue({
      data: {
        query: "yesterday twitter links",
        timezone: "UTC",
        currentScope: { selectedCategoryId: null },
        spaces: [],
      },
      error: null,
    });
    mockInterpretQuery.mockResolvedValue({
      mode: "smart",
      plan: {
        rewrittenQuery: "saved items",
        confidence: 0.92,
        chips: [{ id: "1", kind: "date", label: "Yesterday", preset: "yesterday" }],
      },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuthenticateRequest.mockResolvedValue(null);

    const response = await POST({} as NextRequest);
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({ success: false, limit: 30, reset: Date.now() + 60000, remaining: 0 });

    const response = await POST({} as NextRequest);
    expect(response.status).toBe(429);
  });

  it("returns smart plan on success", async () => {
    const response = await POST({} as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("smart");
    expect(payload.plan.chips).toHaveLength(1);
    expect(payload.plan.rewrittenQuery).toBe("saved items");
  });

  it("returns literal fallback for malformed AI output", async () => {
    mockInterpretQuery.mockResolvedValue({ mode: "literal", reason: "ai_error" });

    const response = await POST({} as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ mode: "literal", reason: "ai_error" });
  });

  it("returns literal fallback on AI timeout", async () => {
    mockInterpretQuery.mockResolvedValue({ mode: "literal", reason: "timeout" });

    const response = await POST({} as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ mode: "literal", reason: "timeout" });
  });

  it("returns ai_unavailable fallback when AI is not configured", async () => {
    mockInterpretQuery.mockResolvedValue({ mode: "literal", reason: "ai_unavailable" });

    const response = await POST({} as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ mode: "literal", reason: "ai_unavailable" });
  });
});
