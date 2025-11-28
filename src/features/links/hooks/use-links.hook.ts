"use client";

import * as React from "react";
import { toast } from "sonner";
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

    // Refresh links from server
    const refreshLinks = React.useCallback(async () => {
        try {
            const queryString = buildQueryString();
            const response = await fetch(`/api/links?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                setLinks(data.links || []);
            } else if (response.status === 401) {
                // Unauthorized: show error toast
                toast.error('Unauthorized - please log in');
            }
        } catch (error) {
            console.error("Error refreshing links:", error);
        }
    }, [buildQueryString]);

    // Fetch links on mount or when filters change
    React.useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchLinks() {
            setFetchingLinks(true);
            try {
                const queryString = buildQueryString();
                const response = await fetch(`/api/links?${queryString}`);
                if (response.ok) {
                    const data = await response.json();
                    setLinks(data.links || []);
                } else if (response.status === 401) {
                    // Unauthorized: show error toast
                    toast.error('Unauthorized - please log in');
                } else {
                    toast.error("Failed to load links");
                }
            } catch (error) {
                console.error("Error fetching links:", error);
                toast.error("Failed to load links");
            } finally {
                setFetchingLinks(false);
            }
        }

        fetchLinks();
    }, [isAuthenticated, buildQueryString]);

    // Refresh links when window regains focus or becomes visible (for real-time updates from extension)
    React.useEffect(() => {
        if (!isAuthenticated) return;

        const handleVisibilityChange = () => {
            // Refresh links when tab becomes visible (user switches back to the tab)
            if (!document.hidden) {
                refreshLinks();
            }
        };

        const handleFocus = () => {
            // Also refresh on window focus as a fallback
            refreshLinks();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
        };
    }, [isAuthenticated, refreshLinks]);

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
                console.error("Error deleting link:", error);
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
                console.error("Error deleting links:", error);
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
            console.error("Failed to copy URL:", error);
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
                console.error("Error pinning link:", error);
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
                console.error("Error unpinning link:", error);
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
            console.error("Error creating links:", error);
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
