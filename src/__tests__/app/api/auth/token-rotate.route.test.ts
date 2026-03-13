const mockGetUser = jest.fn();
const mockGetActiveApiTokenForUser = jest.fn();
const mockCreateOpaqueApiToken = jest.fn();
const mockRevokeApiToken = jest.fn();

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

jest.mock("@/lib/api-token-service", () => ({
  getActiveApiTokenForUser: (...args: unknown[]) => mockGetActiveApiTokenForUser(...args),
  createOpaqueApiToken: (...args: unknown[]) => mockCreateOpaqueApiToken(...args),
  revokeApiToken: (...args: unknown[]) => mockRevokeApiToken(...args),
}));

import { POST } from "@/app/api/auth/tokens/[id]/rotate/route";

describe("POST /api/auth/tokens/[id]/rotate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user_1" } } });
  });

  it("rotates an active token and revokes the prior token", async () => {
    mockGetActiveApiTokenForUser.mockResolvedValue({
      id: "token_old",
      name: "CLI token",
      expires_at: "2099-01-01T00:00:00Z",
      scope: ["links:read"],
      client_id: "cadie-cli",
      install_id: "install_1",
      install_metadata: { platform: "macOS" },
    });
    mockCreateOpaqueApiToken.mockResolvedValue({
      plaintextToken: "new-token",
      record: {
        id: "token_new",
        name: "CLI token",
        createdAt: "2026-03-13T10:00:00Z",
        expiresAt: "2099-01-01T00:00:00Z",
        scopes: ["links:read"],
        clientId: "cadie-cli",
        installId: "install_1",
        installMetadata: { platform: "macOS" },
        rotatedFromTokenId: "token_old",
      },
    });

    const response = await POST({} as never, { params: Promise.resolve({ id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" }) });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      token: "new-token",
      tokenInfo: {
        id: "token_new",
        name: "CLI token",
        created_at: "2026-03-13T10:00:00Z",
        expires_at: "2099-01-01T00:00:00Z",
        scope: ["links:read"],
        rotated_from_token_id: "token_old",
      },
    });
    expect(mockCreateOpaqueApiToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        rotatedFromTokenId: "token_old",
      })
    );
    expect(mockRevokeApiToken).toHaveBeenCalledWith("3fa85f64-5717-4562-b3fc-2c963f66afa6", "user_1", "rotated");
  });
});
