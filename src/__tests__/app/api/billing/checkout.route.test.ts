const mockCreateLemonCheckout = jest.fn();
const mockGetVariantIdForSelection = jest.fn();
const mockCreateClient = jest.fn();

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

jest.mock("@/lib/billing/lemon-client", () => ({
  createLemonCheckout: (...args: unknown[]) => mockCreateLemonCheckout(...args),
  getVariantIdForSelection: (...args: unknown[]) => mockGetVariantIdForSelection(...args),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { POST } from "@/app/api/billing/checkout/route";

function makeRequest(body: unknown, origin: string) {
  return {
    json: jest.fn().mockResolvedValue(body),
    nextUrl: {
      origin,
    },
  };
}

describe("POST /api/billing/checkout", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user_1", email: "user@example.com" } },
        }),
      },
    });
    mockGetVariantIdForSelection.mockReturnValue("variant_pro_month");
    mockCreateLemonCheckout.mockResolvedValue({ checkoutUrl: "https://checkout.example/session_123" });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses request origin when it is already public", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cadie.app";

    const request = makeRequest(
      {
        plan: "pro",
        interval: "month",
        return_url: "https://staging.cadie.app/?settings=billing",
      },
      "https://staging.cadie.app"
    );

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockCreateLemonCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutReturnUrl: "https://staging.cadie.app/?settings=billing",
      })
    );
  });

  it("falls back to public env origin when request origin is internal", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cadie.app";

    const request = makeRequest(
      {
        plan: "pro",
        interval: "month",
        return_url: "https://cadie.app/?settings=billing",
      },
      "https://0.0.0.0:8080"
    );

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockCreateLemonCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutReturnUrl: "https://cadie.app/?settings=billing",
      })
    );
  });

  it("rejects mismatched return URLs and uses safe fallback", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cadie.app";

    const request = makeRequest(
      {
        plan: "pro",
        interval: "month",
        return_url: "https://evil.example/path",
      },
      "https://0.0.0.0:8080"
    );

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockCreateLemonCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutReturnUrl: "https://cadie.app/?settings=billing",
      })
    );
  });
});
