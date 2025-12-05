"use client";

import useSWR from "swr";
import type { Category } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error?.userMessage || "Failed to fetch");
        throw error;
    }

    return response.json();
}

/**
 * Hook for fetching categories using SWR
 * Benefits:
 * - Automatic caching
 * - Background revalidation
 * - Error retry with exponential backoff
 * - Request deduplication
 */
export function useCategories(isAuthenticated: boolean) {
    const { data, error, isLoading } = useSWR<{ categories: Category[] }>(
        isAuthenticated ? "/api/categories" : null,
        fetcher,
        {
            revalidateOnFocus: false, // Categories don't change often
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute - categories are stable
            shouldRetryOnError: true,
            errorRetryCount: 3,
        }
    );

    return {
        categories: data?.categories || [],
        isLoading,
        isError: !!error,
        error,
    };
}
