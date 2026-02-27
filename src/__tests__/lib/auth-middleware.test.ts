import { authenticateRequest } from "@/lib/auth-middleware";
import { createAdminClient, createClient } from "@/lib/supabase/server";

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

  it("uses admin client for bearer token auth and token last-used update", async () => {
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

    await expect(authenticateRequest(request)).resolves.toBe("user_123");
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

    await expect(authenticateRequest(request)).resolves.toBeNull();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("uses session auth when no bearer token is provided", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "session_user_123" } } }),
      },
    } as never);

    const request = {
      headers: new Headers(),
    } as never;

    await expect(authenticateRequest(request)).resolves.toBe("session_user_123");
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });
});
