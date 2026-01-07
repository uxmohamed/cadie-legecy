"use client";

import useSWR from "swr";
import type { Space } from "@/types";
import { useCallback } from "react";

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
    const { data, error, isLoading, mutate } = useSWR<{ spaces: Space[] }>(
        isAuthenticated ? "/api/spaces" : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute - spaces are relatively stable
            shouldRetryOnError: true,
            errorRetryCount: 3,
        }
    );

    const createSpace = useCallback(async (name: string, color: string): Promise<Space | null> => {
        if (!isAuthenticated) return null;

        try {
            const response = await fetch("/api/spaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create space");
            }

            const { space } = await response.json();

            // Optimistically update cache
            mutate(
                (current) => {
                    if (!current) return { spaces: [space] };
                    return {
                        spaces: [...current.spaces, space],
                    };
                },
                { revalidate: false } // Don't revalidate immediately
            );

            return space;
        } catch (error) {
            console.error("Error creating space:", error);
            // Revalidate to get fresh data
            await mutate();
            return null;
        }
    }, [isAuthenticated, mutate]);

    const updateSpace = useCallback(async (
        id: string,
        updates: { name?: string; color?: string; sort_order?: number }
    ): Promise<boolean> => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch(`/api/spaces/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update space");
            }

            const { space } = await response.json();

            // Optimistically update cache
            mutate(
                (current) => {
                    if (!current) return { spaces: [space] };
                    return {
                        spaces: current.spaces.map((s) =>
                            s.id === id ? { ...s, ...space } : s
                        ),
                    };
                },
                { revalidate: false }
            );

            return true;
        } catch (error) {
            console.error("Error updating space:", error);
            await mutate();
            return false;
        }
    }, [isAuthenticated, mutate]);

    const deleteSpace = useCallback(async (id: string): Promise<boolean> => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch(`/api/spaces/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete space");
            }

            // Optimistically update cache
            mutate(
                (current) => {
                    if (!current) return { spaces: [] };
                    return {
                        spaces: current.spaces.filter((s) => s.id !== id),
                    };
                },
                { revalidate: false }
            );

            return true;
        } catch (error) {
            console.error("Error deleting space:", error);
            await mutate();
            return false;
        }
    }, [isAuthenticated, mutate]);

    const addLinksToSpace = useCallback(async (
        spaceId: string,
        linkIds: string[]
    ): Promise<boolean> => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch(`/api/spaces/${spaceId}/links`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ link_ids: linkIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add links to space");
            }

            // Revalidate to get updated counts
            await mutate();

            return true;
        } catch (error) {
            console.error("Error adding links to space:", error);
            await mutate();
            return false;
        }
    }, [isAuthenticated, mutate]);

    const removeLinksFromSpace = useCallback(async (
        spaceId: string,
        linkIds: string[]
    ): Promise<boolean> => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch(`/api/spaces/${spaceId}/links`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ link_ids: linkIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to remove links from space");
            }

            // Revalidate to get updated counts
            await mutate();

            return true;
        } catch (error) {
            console.error("Error removing links from space:", error);
            await mutate();
            return false;
        }
    }, [isAuthenticated, mutate]);

    return {
        spaces: data?.spaces || [],
        isLoading,
        isError: !!error,
        error,
        createSpace,
        updateSpace,
        deleteSpace,
        addLinksToSpace,
        removeLinksFromSpace,
        refetch: mutate,
    };
}
