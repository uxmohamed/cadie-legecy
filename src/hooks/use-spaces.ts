"use client";

import useSWR from "swr";
import type { Space } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        interface ErrorResponse {
            error?: { userMessage?: string };
        }
        const errorData = (await response.json()) as ErrorResponse;
        const error = new Error(errorData.error?.userMessage || "Failed to fetch");
        throw error;
    }

    return response.json();
}

/**
 * Hook for fetching spaces using SWR
 * Benefits:
 * - Automatic caching
 * - Background revalidation
 * - Error retry with exponential backoff
 * - Request deduplication
 */
export function useSpaces(isAuthenticated: boolean) {
    const { data, error, isLoading } = useSWR<{ spaces: Space[] }>(
        isAuthenticated ? "/api/spaces" : null,
        fetcher,
        {
            revalidateOnFocus: false, // Spaces don't change often
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute - spaces are stable
            shouldRetryOnError: true,
            errorRetryCount: 3,
        }
    );

    return {
        spaces: data?.spaces || [],
        isLoading,
        isError: !!error,
        error,
    };
}
