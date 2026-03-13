import * as React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBillingRealtimeInvalidation } from "@/features/billing/hooks/use-billing-realtime-invalidation.hook";
import { queryKeys } from "@/lib/query/keys";

describe("useBillingRealtimeInvalidation", () => {
  it("invalidates the billing status query when user_billing changes", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

    const handlers: Array<(payload: unknown) => void> = [];
    const channel = {
      on: jest.fn((_event, _filter, callback) => {
        handlers.push(callback as (payload: unknown) => void);
        return channel;
      }),
      subscribe: jest.fn().mockReturnValue("SUBSCRIBED"),
    };

    const removeChannel = jest.fn().mockResolvedValue(undefined);

    (createClient as jest.Mock).mockReturnValue({
      channel: jest.fn(() => channel),
      removeChannel,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => {
      useBillingRealtimeInvalidation(true, "user-1");
      return null;
    }, { wrapper });

    await waitFor(() => {
      expect(handlers).toHaveLength(1);
    });

    act(() => {
      handlers[0]({
        eventType: "UPDATE",
        new: {
          user_id: "user-1",
          updated_at: "2026-03-13T12:00:00.000Z",
        },
        old: {
          user_id: "user-1",
          updated_at: "2026-03-13T11:00:00.000Z",
        },
      });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.billing.all,
      refetchType: "active",
    });
    queryClient.clear();
  });
});
