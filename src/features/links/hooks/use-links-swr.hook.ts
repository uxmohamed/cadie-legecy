"use client";

import useSWR from "swr";
import type { Link, LinkFilters } from "@/features/links/types";

/**
 * Fetcher function for SWR
 * Handles error responses and extracts userMessage for toasts
 */
async function fetcher<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error?.userMessage || "An error occurred");
        // Attach error data for custom error handling
        (error as any).info = errorData;
        (error as any).status = response.status;
        throw error;
    }

    return response.json();
}

/**
 * Build query string from filters
 */
function buildQueryString(filters?: LinkFilters): string {
    const params = new URLSearchParams();

    if (filters?.category_id) {
        params.append("category_id", filters.category_id);
    }

    if (filters?.is_deleted !== undefined) {
        params.append("is_deleted", String(filters.is_deleted));
    } else {
        // Default to active links if no specific view is requested
        params.append("is_deleted", "false");
    }

    return params.toString();
}

/**
 * SWR-based hook for fetching links with automatic caching
 *
 * Benefits:
 * - Automatic request deduplication
 * - Background revalidation
 * - Cache management
 * - Optimized performance
 */
export function useLinksWithSWR(filters?: LinkFilters, enabled: boolean = true) {
    const queryString = buildQueryString(filters);
    const key = enabled ? `/api/links?${queryString}` : null;

    const { data, error, isLoading, mutate, isValidating } = useSWR<{ links: Link[] }>(
        key,
        fetcher,
        {
            // Revalidate on focus to keep data fresh
            revalidateOnFocus: true,
            // Revalidate on reconnect
            revalidateOnReconnect: true,
            // Consider data stale after 5 seconds
            dedupingInterval: 5000,
            // Keep data in cache for 5 minutes
            focusThrottleInterval: 5 * 60 * 1000,
            // Disable automatic revalidation on interval
            refreshInterval: 0,
            // Retry on error with exponential backoff
            shouldRetryOnError: true,
            errorRetryCount: 3,
            errorRetryInterval: 5000,
        }
    );

    return {
        links: data?.links || [],
        isLoading,
        isError: !!error,
        error,
        mutate,
        isValidating,
    };
}
