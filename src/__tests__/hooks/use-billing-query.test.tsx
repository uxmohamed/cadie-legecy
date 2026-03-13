import * as React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBillingQuery } from "@/features/billing/queries/use-billing-query";

describe("useBillingQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bypasses the browser HTTP cache for billing status fetches", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        plan: "starter",
        subscription: {
          status: "inactive",
          interval: null,
          current_period_end: null,
          cancel_at_period_end: false,
          support_amount_cents: null,
        },
        entitlements: {
          maxSavedItems: 100,
          maxSpaces: 5,
          maxImages: 25,
          maxDocuments: 10,
        },
        usage: {
          totalSavedItems: 3,
          spacesTotal: 1,
          imagesTotal: 0,
          documentsTotal: 0,
        },
        warnings: {
          near_starter_saved_items_limit: false,
        },
      }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useBillingQuery(true), { wrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/billing/status",
        expect.objectContaining({
          cache: "no-store",
          signal: expect.any(Object),
        })
      );
    });

    await waitFor(() => {
      expect(result.current.billing?.plan).toBe("starter");
    });

    queryClient.clear();
  });
});
