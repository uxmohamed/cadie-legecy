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
 * Hook for managing links with SWR caching
 * Refactored to follow Single Responsibility Principle
 * Uses API routes for all data operations (proper client/server separation)
 */
export function useLinks(isAuthenticated: boolean, filters?: LinkFilters, userId?: string) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = React.useState(false);

    // Build query string from filters
    const buildQueryString = React.useCallback(() => {
        const params = new URLSearchParams();
        if (filters?.category_id) params.append("category_id", filters.category_id);
        if (filters?.is_deleted !== undefined) params.append("is_deleted", String(filters.is_deleted));

        // Default to active links if no specific view is requested
        if (filters?.is_deleted === undefined) {
            params.append("is_deleted", "false");
        }

        return params.toString();
    }, [filters]);

    const queryString = buildQueryString();

    // Use SWR for data fetching with caching
    const { data, error, isValidating, mutate } = useSWR<{ links: Link[] }>(
        isAuthenticated ? `/api/links?${queryString}` : null,
        fetcher,
        {
            revalidateOnFocus: false, // Don't refetch on window focus
            revalidateOnReconnect: true, // Refetch on reconnect
            dedupingInterval: 30000, // 30 seconds - prevent duplicate requests
            onSuccess: () => {
                setHasInitiallyLoaded(true);
            },
            onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : "Failed to load links";
                toast.error(errorMessage);
                setHasInitiallyLoaded(true);
            },
        }
    );

    const links = data?.links || [];
    const fetchingLinks = isValidating && !hasInitiallyLoaded;

    // Refresh links from server
    const refreshLinks = React.useCallback(async () => {
        try {
            await mutate();
        } catch (error) {
            toast.error("Failed to refresh links");
        }
    }, [mutate]);

    // Store filters in ref to avoid recreating subscription on filter changes
    const filtersRef = React.useRef(filters);
    React.useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    // Store mutate in ref for realtime subscription
    const mutateRef = React.useRef(mutate);
    React.useEffect(() => {
        mutateRef.current = mutate;
    }, [mutate]);

    // Store channel ref to ensure proper cleanup and prevent leaks
    const channelRef = React.useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
    const userIdRef = React.useRef<string | null>(null);

    // Supabase Realtime subscription for real-time updates (when extension saves a link)
    // Only listens to INSERT events - displays new link immediately when saved from extension
    // Non-blocking: uses userId from props instead of fetching auth
    React.useEffect(() => {
        if (!isAuthenticated || !userId) {
            // Clean up channel when not authenticated
            if (channelRef.current) {
                const supabase = createClient();
                supabase.removeChannel(channelRef.current).catch(() => {
                    // Ignore cleanup errors
                });
                channelRef.current = null;
            }
            userIdRef.current = null;
            return;
        }

        const supabase = createClient();
        let isMounted = true;

        // Store user ID immediately (no auth fetch needed)
        userIdRef.current = userId;

        // Setup subscription asynchronously without blocking
        function setupSubscription() {
            try {
                if (!isMounted) return;

                // Remove existing channel if any (from previous subscription)
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current).catch(() => {
                        // Ignore cleanup errors
                    });
                    channelRef.current = null;
                }

                // Create stable channel name (without timestamp to reuse same channel)
                const channelName = `links-realtime-${userId}`;

                const channel = supabase
                    .channel(channelName, {
                        config: {
                            // Configure for better Cloudflare compatibility
                            broadcast: { self: false },
                        },
                    })
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "links",
                        },
                        (payload) => {
                            // Use ref to get latest filters and setLinks
                            if (!isMounted) return;

                            const newLink = payload.new as Link;
                            const currentFilters = filtersRef.current;
                            const currentUserId = userIdRef.current;

                            // Filter by user_id in code (since we removed DB filter to avoid RLS issues)
                            if (!currentUserId || newLink.user_id !== currentUserId) {
                                return;
                            }

                            // Check if link matches current filters
                            const matchesFilters = () => {
                                if (currentFilters?.category_id && newLink.category_id !== currentFilters.category_id) {
                                    return false;
                                }
                                if (currentFilters?.is_deleted !== undefined) {
                                    if (currentFilters.is_deleted) {
                                        // Trash view - show deleted or archived
                                        return newLink.is_deleted || newLink.is_archived;
                                    } else {
                                        // Normal view - exclude deleted and archived
                                        return !newLink.is_deleted && !newLink.is_archived;
                                    }
                                }
                                // Default: show non-deleted, non-archived
                                return !newLink.is_deleted && !newLink.is_archived;
                            };

                            // Only add if matches current filters and doesn't already exist
                            if (matchesFilters()) {
                                mutateRef.current(
                                    (current) => {
                                        if (!current) return current;
                                        // Check if link already exists (avoid duplicates)
                                        if (current.links.some((l: Link) => l.id === newLink.id)) {
                                            return current;
                                        }
                                        // Add new link at the beginning (newest first)
                                        return { links: [newLink, ...current.links] };
                                    },
                                    false // Don't revalidate
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
            userIdRef.current = null;
        };
    }, [isAuthenticated, userId]); // Depend on userId instead of fetching it

    // Filter links based on search query
    const filteredLinks = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return links;
        }

        const lowerQuery = searchQuery.toLowerCase();
        return links.filter((link) => {
            const searchableText = [
                link.title,
                link.url,
                link.domain,
                link.description,
                link.color_value,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(lowerQuery);
        });
    }, [links, searchQuery]);

    const handleSearch = React.useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleDeleteLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            mutate(
                (current) => current ? { links: current.links.filter((link: Link) => link.id !== id) } : current,
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, { method: "DELETE" });

                if (!response.ok) {
                    const errorData = await response.json();
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
                (current) => current ? { links: current.links.filter((link: Link) => link.id !== id) } : current,
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_deleted: false, is_archived: false }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
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
                (current) => current ? { links: current.links.filter((link: Link) => link.id !== id) } : current,
                false
            );

            try {
                const response = await fetch(`/api/links/${id}/permanent`, { method: "DELETE" });

                if (!response.ok) {
                    const errorData = await response.json();
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
                (current) => current ? { links: current.links.filter((link: Link) => !ids.includes(link.id)) } : current,
                false
            );

            // Show toast immediately
            toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} restored`);

            // Single atomic batch request (fire-and-forget)
            fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore', ids }),
            }).catch(err => log.error('Background restore failed', err, { ids }));
        },
        [mutate]
    );

    const handleBatchPermanentDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update - remove from UI immediately
            mutate(
                (current) => current ? { links: current.links.filter((link: Link) => !ids.includes(link.id)) } : current,
                false
            );

            // Show toast immediately
            toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} permanently deleted`);

            // Single atomic batch request (fire-and-forget)
            fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'permanent_delete', ids }),
            }).catch(err => log.error('Background permanent delete failed', err, { ids }));
        },
        [mutate]
    );



    const handleBatchDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update - remove from UI immediately
            mutate(
                (current) => current ? { links: current.links.filter((link: Link) => !ids.includes(link.id)) } : current,
                false
            );

            // Show toast immediately (don't wait for API)
            toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} moved to trash`);

            // Single atomic batch request (fire-and-forget)
            fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', ids }),
            }).catch(err => log.error('Background delete failed', err, { ids }));
        },
        [mutate]
    );

    const handleBatchPinLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update
            mutate(
                (current) => current ? {
                    links: current.links.map((link: Link) =>
                        ids.includes(link.id) ? { ...link, is_pinned: true } : link
                    )
                } : current,
                false
            );

            // Show toast immediately
            toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} pinned`);

            // Single atomic batch request (fire-and-forget)
            fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'pin', ids }),
            }).catch(async (err) => {
                log.error('Background pin failed', err, { ids });
                await mutate();
            });
        },
        [mutate]
    );

    const handleBatchUnpinLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update
            mutate(
                (current) => current ? {
                    links: current.links.map((link: Link) =>
                        ids.includes(link.id) ? { ...link, is_pinned: false } : link
                    )
                } : current,
                false
            );

            // Show toast immediately
            toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} unpinned`);

            // Single atomic batch request (fire-and-forget)
            fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unpin', ids }),
            }).catch(async (err) => {
                log.error('Background unpin failed', err, { ids });
                await mutate();
            });
        },
        [mutate]
    );

    const handleCopyUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("URL copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy URL");
        }
    };

    const handleEditLink = () => {
        toast("Edit functionality coming soon");
    };


    const handlePinLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            mutate(
                (current) => current ? {
                    links: current.links.map((link: Link) =>
                        link.id === id ? { ...link, is_pinned: true } : link
                    )
                } : current,
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_pinned: true }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
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
                (current) => current ? {
                    links: current.links.map((link: Link) =>
                        link.id === id ? { ...link, is_pinned: false } : link
                    )
                } : current,
                false
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_pinned: false }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
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

        setIsLoading(true);
        const toastId = toast.loading(`Adding ${items.length} ${items.length === 1 ? 'item' : 'items'}...`);

        try {
            // Convert DetectedContent to links array for batch API
            const links = items.map(({ value, type }) => ({
                url: value,
                title: value,
                content_type: type,
                color_value: type === "color" ? value : undefined,
            }));

            // Single atomic batch request
            const response = await fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', links }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add links');
            }

            const { count, links: createdLinks } = await response.json();

            // Add all links to UI at once (deduping to prevent duplicate keys)
            if (createdLinks && createdLinks.length > 0) {
                const newLinkIds = new Set(createdLinks.map((l: Link) => l.id));
                mutate(
                    (current) => {
                        if (!current) return { links: createdLinks };
                        // Filter out any existing links with same IDs (realtime might have added them)
                        const existingLinks = current.links.filter((link: Link) => !newLinkIds.has(link.id));
                        return { links: [...createdLinks.reverse(), ...existingLinks] };
                    },
                    false
                );
            }

            toast.dismiss(toastId);
            
            if (count === 1) {
                toast.success(items[0]?.type === "color" ? "Color saved" : "Link saved");
            } else {
                toast.success(`${count} ${items[0]?.type === "color" ? "colors" : "links"} saved`);
            }
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
        hasInitiallyLoaded,
        handleSearch,
        handleSubmit,
        handleDeleteLink,
        handleRestoreLink,
        handlePermanentDeleteLink,
        handleCopyUrl,
        handleEditLink,
        handlePinLink,
        handleUnpinLink,
        handleBatchDeleteLinks,
        handleBatchRestoreLinks,
        handleBatchPermanentDeleteLinks,
        handleBatchPinLinks,
        handleBatchUnpinLinks,
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
