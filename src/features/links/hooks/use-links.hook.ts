"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Link, CreateLinkDTO, LinkFilters } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";
import { log } from "@/lib/logger";

/**
 * Fetcher function for SWR
 * Strips hash fragment from URL (used for cache isolation, not sent to API)
 */
async function fetcher<T>(url: string): Promise<T> {
    // Remove hash fragment (used for cache key isolation only)
    const fetchUrl = url.split('#')[0];
    const response = await fetch(fetchUrl);

    if (!response.ok) {
        // Safely try to parse JSON error, fall back to status text if HTML is returned
        let errorMessage = "Failed to fetch";
        try {
            const errorData = (await response.json()) as any;
            errorMessage = errorData.error?.userMessage || errorData.error || "Failed to fetch";
        } catch {
            // Response was not JSON (likely HTML error page)
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * Hook for managing links with SWR caching
 * Refactored to follow Single Responsibility Principle
 * Uses API routes for all data operations (proper client/server separation)
 */
import useSWRInfinite from "swr/infinite";

// ... (imports remain same)

/**
 * Initial data structure for server-side prefetched links
 */
interface InitialLinksData {
    links: Link[];
    total: number;
}

/**
 * Hook for managing links with SWR caching and infinite scroll
 * Optimized for fast initial render with server-side prefetched data
 */
const PAGE_SIZE = 100; // Balanced for performance and scrolling experience

export function useLinks(
    isAuthenticated: boolean,
    filters?: LinkFilters,
    userId?: string,
    searchQuery: string = "",
    initialData?: InitialLinksData
) {
    const [isLoading, setIsLoading] = React.useState(false);

    // Build query string from filters
    // Include userId in cache key to prevent cross-user cache pollution
    const buildQueryString = React.useCallback((index: number, previousPageData: { links: Link[], total: number } | null) => {
        if (!isAuthenticated || !userId) return null;
        // Reached the end
        if (previousPageData && !previousPageData.links.length) return null;

        const params = new URLSearchParams();
        if (filters?.category_id) params.append("category_id", filters.category_id);
        if (filters?.is_deleted !== undefined) params.append("is_deleted", String(filters.is_deleted));
        if (filters?.is_archived !== undefined) params.append("is_archived", String(filters.is_archived));

        // Default to active links if no specific view is requested
        if (filters?.is_deleted === undefined) {
            params.append("is_deleted", "false");
        }

        // Search query for server-side filtering
        if (searchQuery.trim()) {
            params.append("q", searchQuery.trim());
        }

        // Pagination params
        params.append("limit", String(PAGE_SIZE));
        params.append("offset", String(index * PAGE_SIZE));

        // Include userId in cache key (not sent to API, just for SWR cache isolation)
        return `/api/links?${params.toString()}#user=${userId}`;
    }, [isAuthenticated, filters, searchQuery, userId]);

    // Prepare fallback data from server-side prefetch
    // This allows instant render without loading state
    const fallbackData = React.useMemo(() => {
        if (!initialData || !initialData.links.length) return undefined;
        // Only use initial data for the first page, when no search query is active
        // and filters match the initial data (non-deleted links for dashboard)
        if (searchQuery.trim()) return undefined;
        return [initialData];
    }, [initialData, searchQuery]);

    // Use SWRInfinite for pagination
    const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<{ links: Link[], total: number }>(
        buildQueryString,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            // Only revalidate on mount if we don't have initial data
            // This prevents unnecessary network requests on initial render
            revalidateOnMount: !fallbackData,
            // Revalidate in background after initial render
            revalidateIfStale: true,
            dedupingInterval: 2000,  // Increased for better caching
            // Use server-side prefetched data for instant render
            fallbackData,
            onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : "Failed to load links";
                toast.error(errorMessage);
            },
        }
    );

    // Flatten links from all pages
    const links = React.useMemo(() => {
        return data ? data.flatMap(page => page.links) : [];
    }, [data]);

    const totalCount = data?.[0]?.total || 0;
    const isLoadingMore = isValidating && size > 1 && data && data.length > 0;
    const hasMore = links.length < totalCount;

    // Show skeleton when validating and no links to display
    // This handles: initial load, view transitions with empty cache, and stale empty data
    // Don't show skeleton if we have initial data (instant render from server)
    const fetchingLinks = isValidating && links.length === 0 && !fallbackData;

    const loadMore = React.useCallback(() => {
        if (!isValidating && hasMore) {
            setSize(size + 1);
        }
    }, [isValidating, hasMore, setSize, size]);

    // Refresh links from server
    const refreshLinks = React.useCallback(async () => {
        try {
            await mutate();
        } catch (error) {
            toast.error("Failed to refresh links");
        }
    }, [mutate]);

    // Realtime updates
    const mutateRef = React.useRef(mutate);
    React.useEffect(() => {
        mutateRef.current = mutate;
    }, [mutate]);

    React.useEffect(() => {
        if (!isAuthenticated || !userId) return;

        const supabase = createClient();
        // Use ref for channel to ensure cleanup works across renders
        const channelRef = { current: null as ReturnType<typeof supabase.channel> | null };
        let isMounted = true; // Flag to prevent updates on unmounted component

        const setupSubscription = async () => {
            if (!isMounted || !userId) return;

            try {
                const channel = supabase
                    .channel(`links_for_user_${userId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
                            schema: "public",
                            table: "links",
                            filter: `user_id=eq.${userId}`,
                        },
                        (payload) => {
                            if (!isMounted) return; // Don't process if unmounted

                            const eventType = payload.eventType;
                            const newLink = payload.new as Link;
                            const oldLink = payload.old as Link;

                            const currentMutate = mutateRef.current;
                            if (!currentMutate) return;

                            // Handle DELETE
                            if (eventType === "DELETE") {
                                currentMutate(
                                    (current) => {
                                        if (!current) return current;
                                        return current.map(page => ({
                                            ...page,
                                            links: page.links.filter(l => l.id !== oldLink.id),
                                            total: page.total - 1 // Approximate total update
                                        }));
                                    },
                                    { revalidate: false }
                                );
                                return;
                            }

                            // Helper to check if the new link matches current filters
                            const matchesFilters = () => {
                                if (filters?.category_id && newLink.category_id !== filters.category_id) return false;
                                if (filters?.is_deleted !== undefined && newLink.is_deleted !== filters.is_deleted) return false;
                                // Default to active links if no specific view is requested
                                if (filters?.is_deleted === undefined && newLink.is_deleted) return false;
                                return true;
                            };

                            // Only proceed if matches current filters
                            if (!matchesFilters()) {
                                // If it updated and no longer matches (e.g. moved to trash), remove it
                                if (eventType === "UPDATE") {
                                    currentMutate(
                                        (current) => {
                                            if (!current) return current;
                                            return current.map(page => ({
                                                ...page,
                                                links: page.links.filter(l => l.id !== newLink.id),
                                                total: page.total // Count logic is tricky here, but acceptable
                                            }));
                                        },
                                        { revalidate: false }
                                    );
                                }
                                return;
                            }

                            if (eventType === "UPDATE") {
                                currentMutate(
                                    (current) => {
                                        if (!current) return current;
                                        return current.map(page => ({
                                            ...page,
                                            links: page.links.map(l => l.id === newLink.id ? newLink : l)
                                        }));
                                    },
                                    { revalidate: false }
                                );
                                return;
                            }

                            // Handle INSERT
                            if (eventType === "INSERT") {
                                currentMutate(
                                    (current) => {
                                        if (!current || current.length === 0) {
                                            return [{ links: [newLink], total: 1 }];
                                        }

                                        // Check if link already exists in ANY page (avoid duplicates)
                                        const exists = current.some(page =>
                                            page.links.some(l => l.id === newLink.id)
                                        );

                                        if (exists) {
                                            return current;
                                        }

                                        // Add new link to the first page
                                        const firstPage = current[0];
                                        const updatedFirstPage = {
                                            ...firstPage,
                                            links: [newLink, ...firstPage.links],
                                            total: firstPage.total + 1
                                        };

                                        return [updatedFirstPage, ...current.slice(1)];
                                    },
                                    { revalidate: false } // Don't revalidate to prevent cascade
                                );
                            }
                        }
                    )
                    .subscribe((status) => {
                        // Monitor subscription status for debugging
                        if (process.env.NODE_ENV === 'development') {
                            if (status === "SUBSCRIBED") {
                                log.info("Realtime: Successfully subscribed", { userId });
                            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                                log.warn("Realtime: Subscription failed", { status, userId });
                            }
                        }
                    });

                channelRef.current = channel;
            } catch (error) {
                // Silently fail - Realtime is optional
            }
        }

        // Setup subscription asynchronously without blocking initial render
        // Use setTimeout to ensure it doesn't block the initial fetch
        const timeoutId = setTimeout(setupSubscription, 0);

        // Cleanup function
        return () => {
            clearTimeout(timeoutId);
            isMounted = false;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current).catch(() => {
                    // Ignore cleanup errors
                });
                channelRef.current = null;
            }
        };
    }, [isAuthenticated, userId]); // Depend on userId instead of fetching it

    // Links are now filtered server-side, so filteredLinks is just the links
    const filteredLinks = links;

    const handleDeleteLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.filter((link: Link) => link.id !== id),
                        total: page.total - 1
                    }));
                },
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, { method: "DELETE" });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to delete link";
                    throw new Error(errorMessage);
                }

                toast.success("Link moved to trash");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to delete link";
                toast.error(errorMessage);
                await mutate();
            }
        },
        [mutate]
    );

    const handleRestoreLink = React.useCallback(
        async (id: string) => {
            // Optimistic update - remove from trash view
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.filter((link: Link) => link.id !== id),
                        total: page.total - 1
                    }));
                },
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_deleted: false, is_archived: false }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to restore link";
                    throw new Error(errorMessage);
                }

                toast.success("Link restored");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to restore link";
                toast.error(errorMessage);
                await mutate();
            }
        },
        [mutate]
    );

    const handlePermanentDeleteLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.filter((link: Link) => link.id !== id),
                        total: page.total - 1
                    }));
                },
                false
            );

            try {
                const response = await fetch(`/api/links/${id}/permanent`, { method: "DELETE" });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to permanently delete link";
                    throw new Error(errorMessage);
                }

                toast.success("Link permanently deleted");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to permanently delete link";
                toast.error(errorMessage);
                await mutate();
            }
        },
        [mutate]
    );

    const handleBatchRestoreLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update - remove from trash view immediately
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.filter((link: Link) => !ids.includes(link.id)),
                        total: page.total - ids.length
                    }));
                },
                false
            );

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'restore', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to restore links');
                }

                // Show success toast only after confirmed save
                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} restored`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to restore links';
                toast.error(errorMessage);
                // Revert optimistic update
                await mutate();
            }
        },
        [mutate]
    );

    const handleBatchPermanentDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update - remove from UI immediately
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.filter((link: Link) => !ids.includes(link.id)),
                        total: page.total - ids.length
                    }));
                },
                false
            );

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'permanent_delete', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to permanently delete links');
                }

                // Show success toast only after confirmed save
                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} permanently deleted`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to permanently delete links';
                toast.error(errorMessage);
                // Revert optimistic update
                await mutate();
            }
        },
        [mutate]
    );



    const handleBatchDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update - remove from UI immediately
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.filter((link: Link) => !ids.includes(link.id)),
                        total: page.total - ids.length
                    }));
                },
                false
            );

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to delete links');
                }

                // Show success toast only after confirmed save
                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} moved to trash`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to delete links';
                toast.error(errorMessage);
                // Revert optimistic update
                await mutate();
            }
        },
        [mutate]
    );

    const handleBatchPinLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.map((link: Link) =>
                            ids.includes(link.id) ? { ...link, is_pinned: true } : link
                        )
                    }));
                },
                false
            );

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'pin', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to pin links');
                }

                // Show success toast only after confirmed save
                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} pinned`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to pin links';
                toast.error(errorMessage);
                // Revert optimistic update
                await mutate();
            }
        },
        [mutate]
    );

    const handleBatchUnpinLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.map((link: Link) =>
                            ids.includes(link.id) ? { ...link, is_pinned: false } : link
                        )
                    }));
                },
                false
            );

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'unpin', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to unpin links');
                }

                // Show success toast only after confirmed save
                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} unpinned`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to unpin links';
                toast.error(errorMessage);
                // Revert optimistic update
                await mutate();
            }
        },
        [mutate]
    );

    const handleCopyUrl = async (url: string, isColor?: boolean) => {
        try {
            await navigator.clipboard.writeText(url);
            // Auto-detect color by checking for hex format
            const isColorValue = isColor ?? /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(url);
            toast.success(isColorValue ? "Color copied to clipboard" : "URL copied to clipboard");
        } catch (error) {
            const isColorValue = isColor ?? /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(url);
            toast.error(isColorValue ? "Failed to copy color" : "Failed to copy URL");
        }
    };

    const handleEditLink = () => {
        toast("Edit functionality coming soon");
    };

    const handleUpdateLink = React.useCallback(
        async (id: string, updates: Partial<Link>) => {
            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.map((link: Link) =>
                            link.id === id ? { ...link, ...updates } : link
                        )
                    }));
                },
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to update link";
                    throw new Error(errorMessage);
                }
                // No toast on success - the UI update is immediate feedback
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to update link";
                toast.error(errorMessage);
                await mutate();
            }
        },
        [mutate]
    );


    const handlePinLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.map((link: Link) =>
                            link.id === id ? { ...link, is_pinned: true } : link
                        )
                    }));
                },
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_pinned: true }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to pin link";
                    throw new Error(errorMessage);
                }

                toast.success("Link pinned");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to pin link";
                toast.error(errorMessage);
                await mutate();
            }
        },
        [mutate]
    );

    const handleUnpinLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.map(page => ({
                        ...page,
                        links: page.links.map((link: Link) =>
                            link.id === id ? { ...link, is_pinned: false } : link
                        )
                    }));
                },
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_pinned: false }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to unpin link";
                    throw new Error(errorMessage);
                }

                toast.success("Link unpinned");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to unpin link";
                toast.error(errorMessage);
                await mutate();
            }
        },
        [mutate]
    );

    const handleSubmit = async (items: DetectedContent[]) => {
        if (items.length === 0) return;

        // Client-side duplicate detection - check against existing links AND within the batch
        const existingUrls = new Set(links.map((link) => link.url.toLowerCase()));
        const seenInBatch = new Set<string>();
        const newItems: DetectedContent[] = [];
        const duplicateItems: DetectedContent[] = [];

        for (const item of items) {
            const normalizedUrl = item.value.toLowerCase();

            // Check if duplicate of existing link or already seen in this batch
            if (existingUrls.has(normalizedUrl) || seenInBatch.has(normalizedUrl)) {
                duplicateItems.push(item);
            } else {
                newItems.push(item);
                seenInBatch.add(normalizedUrl);
            }
        }

        // If all items are duplicates, show toast and return early (no server call)
        if (newItems.length === 0) {
            showSubmitToast(
                items.length,
                0, // successCount
                duplicateItems.length,
                0, // restored
                0, // failures
                items[0]?.type
            );
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading(`Adding ${newItems.length} ${newItems.length === 1 ? 'item' : 'items'}...`);

        try {
            // Convert DetectedContent to links array for batch API (only new items)
            const linksToAdd = newItems.map(({ value, type }) => ({
                url: value,
                title: value,
                content_type: type,
                color_value: type === "color" ? value : undefined,
            }));

            // Single atomic batch request
            const response = await fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', links: linksToAdd }),
            });

            if (!response.ok) {
                // Safely try to parse JSON error, fall back to status text if HTML is returned
                let errorMessage = 'Failed to add links';
                try {
                    const errorData = (await response.json()) as any;
                    errorMessage = errorData.error || 'Failed to add links';
                } catch {
                    // Response was not JSON (likely HTML error page)
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const responseData = (await response.json()) as { links?: Link[], count?: number, restored?: number };
            const createdLinks = responseData.links || [];
            const count = responseData.count || createdLinks.length;
            const restored = responseData.restored || 0;

            // Add all links to UI at once (deduping to prevent duplicate keys)
            if (createdLinks && createdLinks.length > 0) {
                const newLinkIds = new Set(createdLinks.map((l: Link) => l.id));
                mutate(
                    (current) => {
                        if (!current) return [{ links: createdLinks, total: createdLinks.length }];

                        // Add to first page
                        const firstPage = current[0];
                        // Filter out any existing links with same IDs (realtime might have added them)
                        const existingLinks = firstPage.links.filter((link: Link) => !newLinkIds.has(link.id));

                        const updatedFirstPage = {
                            ...firstPage,
                            links: [...createdLinks.reverse(), ...existingLinks],
                            total: firstPage.total + createdLinks.length
                        };

                        return [updatedFirstPage, ...current.slice(1)];
                    },
                    false
                );
            }

            toast.dismiss(toastId);

            // Calculate success count (new links only, not restored)
            const successCount = count - restored;

            // Use the comprehensive toast helper (include client-side detected duplicates)
            showSubmitToast(
                items.length,
                successCount,
                duplicateItems.length,
                restored,
                0, // failures
                items[0]?.type
            );
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(
                error instanceof Error ? error.message : "Failed to save"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        links,
        filteredLinks,
        isLoading,
        fetchingLinks,
        handleSubmit,
        handleDeleteLink,
        handleRestoreLink,
        handlePermanentDeleteLink,
        handleCopyUrl,
        handleEditLink,
        handleUpdateLink,
        handlePinLink,
        handleUnpinLink,
        handleBatchDeleteLinks,
        handleBatchRestoreLinks,
        handleBatchPermanentDeleteLinks,
        handleBatchPinLinks,
        handleBatchUnpinLinks,
        hasMore,
        loadMore,
        isLoadingMore,
    };
}

/**
 * Helper function to show appropriate toast message based on results
 */
function showSubmitToast(
    totalItems: number,
    successCount: number,
    duplicateCount: number,
    restoredCount: number,
    failureCount: number,
    contentType?: string
) {
    if (totalItems === 1) {
        if (restoredCount === 1) {
            const message =
                contentType === "color"
                    ? "Color restored from trash"
                    : "Link restored from trash";
            toast.success(message);
        } else if (successCount === 1) {
            const message =
                contentType === "color"
                    ? "Color saved successfully"
                    : "Link saved successfully";
            toast.success(message);
        } else if (duplicateCount === 1) {
            const message =
                contentType === "color"
                    ? "This color is already in your list"
                    : contentType === "url"
                        ? "This link is already in your list"
                        : "This item is already in your list";
            toast(message);
        } else {
            toast.error("Failed to save");
        }
    } else {
        const parts: string[] = [];

        if (successCount > 0) {
            parts.push(`${successCount} added`);
        }
        if (restoredCount > 0) {
            parts.push(`${restoredCount} restored from trash`);
        }
        if (duplicateCount > 0) {
            parts.push(`${duplicateCount} already in list`);
        }
        if (failureCount > 0) {
            parts.push(`${failureCount} failed`);
        }

        if (failureCount > 0 && successCount === 0 && restoredCount === 0) {
            toast.error("Failed to add links");
        } else if (parts.length > 0) {
            toast.success(parts.join(", "));
        }
    }
}
