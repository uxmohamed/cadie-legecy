const mockRedirect = jest.fn(() => {
  throw new Error("NEXT_REDIRECT");
});

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
  getUser: jest.fn(),
}));

jest.mock("@/components/dashboard-client", () => ({
  DashboardClient: () => null,
}));

jest.mock("@/components/landing-page", () => ({
  LandingPage: () => null,
}));

jest.mock("@/components/onboarding-client", () => ({
  OnboardingClient: () => null,
}));

jest.mock("@/lib/billing/lemon-client", () => ({
  fetchVariantPrices: jest.fn(),
}));

jest.mock("@/lib/server/prefetch-links", () => ({
  prefetchSpaces: jest.fn(),
}));

jest.mock("contentlayer/generated", () => ({
  allChangelogs: [],
}), { virtual: true });

import Home from "@/app/page";

describe("Home page auth code forwarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards root callback codes to /auth/callback", async () => {
    await expect(
      Home({
        searchParams: Promise.resolve({
          code: "abc123",
          state: "xyz",
        }),
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/auth/callback?code=abc123&state=xyz");
  });
});
