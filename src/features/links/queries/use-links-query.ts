"use client";

import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Link, LinkFilters } from "@/features/links/types";
import { queryKeys } from "@/lib/query/keys";

/**
 * Page size for pagination/infinite scroll
 */
const PAGE_SIZE = 100;

/**
 * Response type from the links API
 */
interface LinksResponse {
  links: Link[];
  total: number;
}

/**
 * Build query string for API requests
 */
function buildQueryString(
  filters: LinkFilters,
  searchQuery: string,
  offset: number,
  limit: number = PAGE_SIZE
): string {
  const params = new URLSearchParams();
  
  if (filters.space_id) {
    params.append("space_id", filters.space_id);
  }
  
  if (filters.is_deleted !== undefined) {
    params.append("is_deleted", String(filters.is_deleted));
  } else {
    params.append("is_deleted", "false");
  }
  
  if (filters.is_archived !== undefined) {
    params.append("is_archived", String(filters.is_archived));
  } else if (filters.is_deleted === false || filters.is_deleted === undefined) {
    params.append("is_archived", "false");
  }
  
  if (filters.is_pinned !== undefined) {
    params.append("is_pinned", String(filters.is_pinned));
  }
  
  if (searchQuery.trim()) {
    params.append("q", searchQuery.trim());
  }
  
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  
  return `/api/links?${params.toString()}`;
}

/**
 * Fetch links from API
 */
async function fetchLinks(
  filters: LinkFilters,
  searchQuery: string,
  offset: number = 0,
  limit: number = PAGE_SIZE
): Promise<LinksResponse> {
  const url = buildQueryString(filters, searchQuery, offset, limit);
  const response = await fetch(url);

  if (!response.ok) {
    let errorMessage = "Failed to fetch links";
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

/**
 * Hook to fetch links using TanStack Query
 * 
 * Features:
 * - Automatic caching with IndexedDB persistence
 * - Background revalidation
 * - Optimistic updates via mutations
 * - Stable query keys with serialized filters
 */
export function useLinksQuery(
  filters: LinkFilters,
  searchQuery: string = "",
  enabled: boolean = true,
  initialData?: LinksResponse
) {
  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => filters, [
    filters.space_id,
    filters.is_archived,
    filters.is_deleted,
    filters.is_pinned,
    filters.content_type,
  ]);

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.links.list(stableFilters),
    queryFn: () => fetchLinks(stableFilters, searchQuery),
    enabled,
    initialData,
    // Allow realtime to handle updates for 5 minutes before considering stale
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 2 hours (reduced from 24 to prevent stale data issues)
    gcTime: 2 * 60 * 60 * 1000,
  });

  return {
    links: query.data?.links ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}

/**
 * Hook for infinite scroll pagination of links
 */
export function useLinksInfiniteQuery(
  filters: LinkFilters,
  searchQuery: string = "",
  enabled: boolean = true,
  initialData?: LinksResponse
) {
  const stableFilters = useMemo(() => filters, [
    filters.space_id,
    filters.is_archived,
    filters.is_deleted,
    filters.is_pinned,
    filters.content_type,
  ]);

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.links.list(stableFilters), "infinite", searchQuery],
    queryFn: ({ pageParam = 0 }) => fetchLinks(stableFilters, searchQuery, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.links.length, 0);
      if (loadedCount >= lastPage.total) {
        return undefined; // No more pages
      }
      return loadedCount; // Next offset
    },
    enabled,
    initialData: initialData ? {
      pages: [initialData],
      pageParams: [0],
    } : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  // Flatten all pages into a single array
  const links = useMemo(() => {
    return query.data?.pages.flatMap(page => page.links) ?? [];
  }, [query.data?.pages]);

  const total = query.data?.pages[0]?.total ?? 0;

  return {
    links,
    total,
    hasMore: links.length < total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

/**
 * Hook to get a single link by ID
 */
export function useLinkQuery(linkId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.links.detail(linkId ?? ""),
    queryFn: async () => {
      if (!linkId) throw new Error("Link ID required");
      
      const response = await fetch(`/api/links/${linkId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch link");
      }
      const data = await response.json();
      return data.link as Link;
    },
    enabled: enabled && !!linkId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
