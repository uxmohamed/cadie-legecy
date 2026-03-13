jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: string | URL) => ({
      status: 307,
      headers: new Headers({ location: String(url) }),
      url: String(url),
    }),
  },
}));

import { GET } from "@/app/auth/callback/route";
import { createClient } from "@/lib/supabase/server";

describe("GET /auth/callback", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
      },
    } as never);
  });

  it("redirects to dashboard root when no next path is provided", async () => {
    const request = new Request("https://www.cadie.app/auth/callback?code=test-code");

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://www.cadie.app/");
  });

  it("falls back to dashboard root for blocked redirect paths", async () => {
    const request = new Request("https://www.cadie.app/auth/callback?code=test-code&next=/auth");

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://www.cadie.app/");
  });

  it("uses forwarded host/proto headers for successful redirects", async () => {
    const request = new Request("http://internal/auth/callback?code=test-code&next=/space/abc", {
      headers: {
        "x-forwarded-host": "staging.cadie.app",
        "x-forwarded-proto": "https",
      },
    });

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://staging.cadie.app/space/abc");
  });
});
