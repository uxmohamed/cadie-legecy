import { authenticateRequest, createRequestContext } from "@/lib/auth-middleware";
import { createAdminClient, createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
  createClient: jest.fn(),
}));

describe("auth-middleware", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
  let digestSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    if (!global.crypto || !global.crypto.subtle) {
      Object.defineProperty(global, "crypto", {
        configurable: true,
        value: {
          subtle: {
            digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
          },
          getRandomValues: (array: Uint8Array) => array,
        },
      });
      return;
    }

    digestSpy = jest
      .spyOn(global.crypto.subtle, "digest")
      .mockResolvedValue(new ArrayBuffer(32));
  });

  afterEach(() => {
    digestSpy?.mockRestore();
    digestSpy = undefined;
  });

  it("returns an api_token request context for bearer auth and updates token last-used", async () => {
    const select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        gt: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: "user_123", id: "token_id_123", expires_at: "2099-01-01T00:00:00Z" },
            error: null,
          }),
        }),
      }),
    });

    const update = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const from = jest.fn(() => ({
      select,
      update,
    }));

    mockCreateAdminClient.mockReturnValue({ from } as never);

    const request = {
      headers: new Headers({
        authorization: `Bearer ${"a".repeat(64)}`,
      }),
    } as never;

    await expect(createRequestContext(request)).resolves.toEqual({
      userId: "user_123",
      authSource: "api_token",
      token: {
        id: "token_id_123",
        expiresAt: "2099-01-01T00:00:00Z",
        scopes: ["legacy_full_access"],
      },
    });
    expect(mockCreateAdminClient).toHaveBeenCalledTimes(2);
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("api_tokens");
  });

  it("does not fall back to session auth when bearer token is invalid", async () => {
    mockCreateAdminClient.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
            }),
          }),
        }),
      })),
    } as never);

    const request = {
      headers: new Headers({
        authorization: `Bearer ${"b".repeat(64)}`,
      }),
    } as never;

    await expect(createRequestContext(request)).resolves.toBeNull();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("returns a session request context when no bearer token is provided", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "session_user_123" } } }),
      },
    } as never);

    const request = {
      headers: new Headers(),
    } as never;

    await expect(createRequestContext(request)).resolves.toEqual({
      userId: "session_user_123",
      authSource: "session",
      token: null,
    });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("keeps authenticateRequest as a user-id compatibility wrapper", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "compat_user_123" } } }),
      },
    } as never);

    const request = {
      headers: new Headers(),
    } as never;

    await expect(authenticateRequest(request)).resolves.toBe("compat_user_123");
  });
});
