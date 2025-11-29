"use client";

import * as React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Link, CreateLinkDTO, LinkFilters } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";

/**
 * Hook for managing links
 * Refactored to follow Single Responsibility Principle
 * Uses API routes for all data operations (proper client/server separation)
 */
export function useLinks(isAuthenticated: boolean, filters?: LinkFilters) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [links, setLinks] = React.useState<Link[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [fetchingLinks, setFetchingLinks] = React.useState(true);

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

    // AbortController ref to cancel in-flight requests
    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Cleanup: Cancel any in-flight requests on unmount
    React.useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Refresh links from server
    const refreshLinks = React.useCallback(async () => {
        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const queryString = buildQueryString();
            const response = await fetch(`/api/links?${queryString}`, {
                signal: abortController.signal,
            });
            
            // Check if request was aborted
            if (abortController.signal.aborted) return;

            if (response.ok) {
                const data = await response.json();
                setLinks(data.links || []);
            } else if (response.status === 401) {
                // Unauthorized: show error toast
                toast.error('Unauthorized - please log in');
            } else {
                toast.error("Failed to refresh links");
            }
            } catch (error) {
                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                toast.error("Failed to refresh links");
            }
    }, [buildQueryString]);

    // Fetch links on mount or when filters change
    React.useEffect(() => {
        if (!isAuthenticated) return;

        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        async function fetchLinks() {
            setFetchingLinks(true);
            try {
                const queryString = buildQueryString();
                const response = await fetch(`/api/links?${queryString}`, {
                    signal: abortController.signal,
                });
                
                // Check if request was aborted
                if (abortController.signal.aborted) return;

                if (response.ok) {
                    const data = await response.json();
                    // Replace links completely - server is source of truth
                    // Realtime will add new links on top, but fetchLinks should replace
                    setLinks(data.links || []);
                } else if (response.status === 401) {
                    // Unauthorized: show error toast
                    toast.error('Unauthorized - please log in');
                } else {
                    toast.error("Failed to load links");
                }
            } catch (error) {
                // Ignore abort errors
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                toast.error("Failed to load links");
            } finally {
                setFetchingLinks(false);
            }
        }

        fetchLinks();
    }, [isAuthenticated, buildQueryString]);

    // Store filters in ref to avoid recreating subscription on filter changes
    const filtersRef = React.useRef(filters);
    React.useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    // Store setLinks in ref to avoid stale closure in subscription callback
    const setLinksRef = React.useRef(setLinks);
    React.useEffect(() => {
        setLinksRef.current = setLinks;
    }, []);

    // Store channel ref to ensure proper cleanup and prevent leaks
    const channelRef = React.useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
    const userIdRef = React.useRef<string | null>(null);

    // Supabase Realtime subscription for real-time updates (when extension saves a link)
    // Only listens to INSERT events - displays new link immediately when saved from extension
    React.useEffect(() => {
        if (!isAuthenticated) {
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

        async function setupSubscription() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError || !user) {
                    return;
                }

                if (!isMounted) return;

                // Store user ID for use in callback
                const userId = user.id;
                userIdRef.current = userId;

                // Remove existing channel if any (from previous subscription)
                if (channelRef.current) {
                    await supabase.removeChannel(channelRef.current);
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
                                setLinksRef.current((prev) => {
                                    // Check if link already exists (avoid duplicates)
                                    if (prev.some((l) => l.id === newLink.id)) {
                                        return prev;
                                    }
                                    // Add new link at the beginning (newest first)
                                    return [newLink, ...prev];
                                });
                            }
                        }
                    )
                    .subscribe((status) => {
                        // Monitor subscription status for debugging
                        if (process.env.NODE_ENV === 'development') {
                            if (status === "SUBSCRIBED") {
                                console.log("Realtime: Successfully subscribed");
                            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                                console.warn("Realtime: Subscription failed", status);
                            }
                        }
                    });

                channelRef.current = channel;
            } catch (error) {
                // Silently fail - Realtime is optional
            }
        }

        setupSubscription();

        // Cleanup function
        return () => {
            isMounted = false;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current).catch(() => {
                    // Ignore cleanup errors
                });
                channelRef.current = null;
            }
            userIdRef.current = null;
        };
    }, [isAuthenticated]); // Only depend on isAuthenticated, not filters

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
            setLinks((prev) => prev.filter((link) => link.id !== id));

            try {
                const response = await fetch(`/api/links/${id}`, { method: "DELETE" });

                if (!response.ok) {
                    throw new Error("Failed to delete link");
                }

                toast.success("Link deleted");
            } catch (error) {
                toast.error("Failed to delete link");
                await refreshLinks();
            }
        },
        [refreshLinks]
    );



    const handleBatchDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            // Optimistic update
            setLinks((prev) => prev.filter((link) => !ids.includes(link.id)));

            try {
                await Promise.all(
                    ids.map(async (id) => {
                        const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
                        if (!response.ok) throw new Error(`Failed to delete link ${id}`);
                    })
                );

                toast.success(`${ids.length} links deleted`);
            } catch (error) {
                toast.error("Failed to delete some links");
                await refreshLinks();
            }
        },
        [refreshLinks]
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
            setLinks((prev) =>
                prev.map((link) =>
                    link.id === id ? { ...link, is_pinned: true } : link
                )
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_pinned: true }),
                });

                if (!response.ok) {
                    throw new Error("Failed to pin link");
                }

                toast.success("Link pinned");
            } catch (error) {
                toast.error("Failed to pin link");
                await refreshLinks();
            }
        },
        [refreshLinks]
    );

    const handleUnpinLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            setLinks((prev) =>
                prev.map((link) =>
                    link.id === id ? { ...link, is_pinned: false } : link
                )
            );

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_pinned: false }),
                });

                if (!response.ok) {
                    throw new Error("Failed to unpin link");
                }

                toast.success("Link unpinned");
            } catch (error) {
                toast.error("Failed to unpin link");
                await refreshLinks();
            }
        },
        [refreshLinks]
    );

    const handleSubmit = async (items: DetectedContent[]) => {
        if (items.length === 0) return;

        setIsLoading(true);

        try {
            // Convert DetectedContent to CreateLinkDTO
            const linkDTOs: CreateLinkDTO[] = items.map(({ value, type }) => {
                const dto: CreateLinkDTO = {
                    url: value,
                    title: value,
                    content_type: type,
                    og_image_url: null,
                };

                if (type === "color") {
                    dto.color_value = value;
                }

                return dto;
            });

            // Make API calls
            const results = await Promise.allSettled(
                linkDTOs.map(async (dto) => {
                    const response = await fetch("/api/links", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dto),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || "Failed to create link");
                    }

                    return response.json();
                })
            );

            // Process results
            let successCount = 0;
            let duplicateCount = 0;
            let failureCount = 0;
            const newLinks: Link[] = [];

            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    const { link, duplicate } = result.value;
                    if (duplicate) {
                        duplicateCount++;
                    } else {
                        successCount++;
                        newLinks.push(link);
                    }
                } else {
                    failureCount++;
                }
            });

            // Update state with new links
            if (newLinks.length > 0) {
                setLinks((prev) => [...newLinks, ...prev]);
            }

            // Show toast notifications
            showSubmitToast(items.length, successCount, duplicateCount, failureCount, items[0]?.type);
        } catch (error) {
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
        handleSearch,
        handleSubmit,
        handleDeleteLink,
        handleCopyUrl,
        handleEditLink,
        handlePinLink,
        handleUnpinLink,
        handleBatchDeleteLinks,
    };
}

/**
 * Helper function to show appropriate toast message based on results
 */
function showSubmitToast(
    totalItems: number,
    successCount: number,
    duplicateCount: number,
    failureCount: number,
    contentType?: string
) {
    if (totalItems === 1) {
        if (successCount === 1) {
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
        if (successCount > 0 && duplicateCount === 0 && failureCount === 0) {
            toast.success(
                `${successCount} ${successCount === 1 ? "link" : "links"
                } added successfully`
            );
        } else if (successCount > 0 && duplicateCount > 0) {
            toast(
                `${successCount} ${successCount === 1 ? "link" : "links"
                } added, ${duplicateCount} ${duplicateCount === 1 ? "was" : "were"
                } already in your list`
            );
        } else if (duplicateCount > 0 && successCount === 0) {
            toast(
                `${duplicateCount} ${duplicateCount === 1 ? "link was" : "links were"
                } already in your list`
            );
        } else if (failureCount > 0) {
            if (successCount > 0) {
                toast(
                    `${successCount} ${successCount === 1 ? "link" : "links"
                    } added, ${failureCount} failed`
                );
            } else {
                toast.error("Failed to add links");
            }
        }
    }
}
