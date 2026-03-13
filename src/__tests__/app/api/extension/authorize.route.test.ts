const mockGetUser = jest.fn();
const mockRateLimitExtensionAuthLimit = jest.fn();
const mockGetIdentifier = jest.fn();
const mockGetRateLimitHeaders = jest.fn();
const mockCreateOpaqueApiToken = jest.fn();
const mockRevokeMatchingInstallTokens = jest.fn();

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
  createClient: jest.fn(async () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  })),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimitExtensionAuth: {
    limit: (...args: unknown[]) => mockRateLimitExtensionAuthLimit(...args),
  },
  getIdentifier: (...args: unknown[]) => mockGetIdentifier(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

jest.mock("@/lib/api-token-service", () => ({
  createOpaqueApiToken: (...args: unknown[]) => mockCreateOpaqueApiToken(...args),
  revokeMatchingInstallTokens: (...args: unknown[]) => mockRevokeMatchingInstallTokens(...args),
}));

import { POST } from "@/app/api/extension/authorize/route";

describe("POST /api/extension/authorize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user_1",
          email: "user@example.com",
        },
      },
    });
    mockGetIdentifier.mockReturnValue("user:user_1");
    mockGetRateLimitHeaders.mockReturnValue({
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": "9",
      "X-RateLimit-Reset": "123",
    });
    mockRateLimitExtensionAuthLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 123,
    });
    mockRevokeMatchingInstallTokens.mockResolvedValue(["token_old"]);
    mockCreateOpaqueApiToken.mockResolvedValue({
      plaintextToken: "opaque-token",
      record: {
        id: "token_new",
        name: "Extension",
        createdAt: "2026-03-13T10:00:00Z",
        expiresAt: "2027-03-13T10:00:00Z",
        scopes: ["legacy_full_access"],
        clientId: "cadie-browser-extension",
        installId: "install_1",
        rotatedFromTokenId: "token_old",
      },
    });
  });

  it("rejects authorization without a valid state token", async () => {
    const response = await POST({
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({
        installId: "install_1",
      }),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Valid auth state is required" });
    expect(mockCreateOpaqueApiToken).not.toHaveBeenCalled();
  });

  it("returns the auth state with the newly minted token", async () => {
    const response = await POST({
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({
        name: "Extension",
        installId: "install_1",
        state: "state_123",
        clientId: "cadie-browser-extension",
        extensionVersion: "0.1.2",
        browserName: "chrome",
        platform: "macOS",
      }),
    } as never);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      token: "opaque-token",
      state: "state_123",
      user: {
        id: "user_1",
        email: "user@example.com",
      },
      tokenInfo: {
        id: "token_new",
        name: "Extension",
        created_at: "2026-03-13T10:00:00Z",
        expires_at: "2027-03-13T10:00:00Z",
        scope: ["legacy_full_access"],
        client_id: "cadie-browser-extension",
        install_id: "install_1",
        rotated_from_token_id: "token_old",
        replaced_token_ids: ["token_old"],
      },
    });
    expect(mockGetIdentifier).toHaveBeenCalled();
    expect(mockRateLimitExtensionAuthLimit).toHaveBeenCalledWith("user:user_1");
    expect(mockRevokeMatchingInstallTokens).toHaveBeenCalledWith(
      "user_1",
      "install_1",
      "cadie-browser-extension"
    );
    expect(mockCreateOpaqueApiToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        installId: "install_1",
        clientId: "cadie-browser-extension",
      })
    );
  });
});
