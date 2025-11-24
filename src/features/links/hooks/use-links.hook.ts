"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Link, CreateLinkDTO } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";
import type { SerializedEditorState } from "lexical";

/**
 * Hook for managing links
 * Refactored to follow Single Responsibility Principle
 * Uses API routes for all data operations (proper client/server separation)
 */
export function useLinks(isAuthenticated: boolean) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [links, setLinks] = React.useState<Link[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [fetchingLinks, setFetchingLinks] = React.useState(true);

    // Fetch links on mount
    React.useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchLinks() {
            try {
                const response = await fetch("/api/links?is_archived=false");
                if (response.ok) {
                    const data = await response.json();
                    setLinks(data.links || []);
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
    }, [isAuthenticated]);

    // Refresh links from server
    const refreshLinks = React.useCallback(async () => {
        try {
            const response = await fetch("/api/links?is_archived=false");
            if (response.ok) {
                const data = await response.json();
                setLinks(data.links || []);
            }
        } catch (error) {
            console.error("Error refreshing links:", error);
        }
    }, []);

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

    const handleArchiveLink = React.useCallback(
        async (id: string) => {
            // Optimistic update
            setLinks((prev) => prev.filter((link) => link.id !== id));

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_archived: true }),
                });

                if (!response.ok) {
                    throw new Error("Failed to archive link");
                }

                toast.success("Link archived");
            } catch (error) {
                console.error("Error archiving link:", error);
                toast.error("Failed to archive link");
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

    const handleSaveRichText = async (
        editingLink: Link,
        content: SerializedEditorState
    ) => {
        try {
            const response = await fetch(`/api/links/${editingLink.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rich_text_content: content }),
            });

            if (!response.ok) {
                throw new Error("Failed to save rich text");
            }

            const { link: updatedLink } = await response.json();

            setLinks((prev) =>
                prev.map((l) => (l.id === editingLink.id ? updatedLink : l))
            );
        } catch (error) {
            console.error("Error saving rich text:", error);
            toast.error("Failed to save rich text");
            throw error;
        }
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
        handleArchiveLink,
        handleCopyUrl,
        handleEditLink,
        handleSaveRichText,
        handlePinLink,
        handleUnpinLink,
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
