"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Entitlements, PlanTier } from "@/lib/billing/types";
import { queryKeys } from "@/lib/query/keys";

export interface BillingStatus {
  plan: PlanTier;
  subscription: {
    status: string;
    interval: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    support_amount_cents: number | null;
  };
  entitlements: Entitlements;
  usage: {
    totalSavedItems: number;
    spacesTotal: number;
    imagesTotal: number;
    documentsTotal: number;
  };
  warnings: {
    near_starter_saved_items_limit: boolean;
  };
}

async function fetchBillingStatus(signal?: AbortSignal): Promise<BillingStatus> {
  const response = await fetch("/api/billing/status", {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch billing status";
    try {
      const errorData = (await response.json()) as { error?: { userMessage?: string } | string };
      if (typeof errorData.error === "string") {
        errorMessage = errorData.error;
      } else {
        errorMessage = errorData.error?.userMessage ?? errorMessage;
      }
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export function useBillingQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.billing.status(),
    queryFn: ({ signal }) => fetchBillingStatus(signal),
    enabled,
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    staleTime: 5 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  return {
    billing: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}
