"use client";

import * as React from "react";
import { toast } from "sonner";
import { canonicalizeContent } from "@/lib/canonicalize";
import type { Link } from "@/types";
import type { DetectedContent } from "@/lib/content-detector";
import type { SerializedEditorState } from "lexical";

export function useLinks(isAuthenticated: boolean) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [links, setLinks] = React.useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [fetchingLinks, setFetchingLinks] = React.useState(true);

  // Reusable function to refresh links from server
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
    [toast, refreshLinks]
  );

  const handleArchiveLink = React.useCallback(
    async (id: string) => {
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
    [toast, refreshLinks]
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
    [toast, refreshLinks]
  );

  const handleUnpinLink = React.useCallback(
    async (id: string) => {
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
    [toast, refreshLinks]
  );

  const handleSubmit = async (items: DetectedContent[]) => {
    if (items.length === 0) return;

    setIsLoading(true);

    try {
      let successCount = 0;
      let duplicateCount = 0;
      let failureCount = 0;

      const results = await Promise.allSettled(
        items.map(async ({ value, type }) => {
          const canonicalValue = canonicalizeContent(value, type);

          const isDuplicate = links.some((link) => {
            if (link.content_type !== type) return false;

            let linkValue = "";
            if (type === "color") {
              linkValue = link.color_value || link.title;
            } else if (type === "url") {
              linkValue = link.url;
            } else {
              linkValue = link.title;
            }

            const canonicalLinkValue = canonicalizeContent(linkValue, type);
            return canonicalLinkValue === canonicalValue;
          });

          if (isDuplicate) {
            return { status: "duplicate" as const };
          }

          const requestBody: Record<string, unknown> = {
            url: value,
            title: value,
            content_type: type,
          };

          if (type === "color") {
            requestBody.color_value = value;
          }

          const response = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create link");
          }

          const { link } = await response.json();

          return {
            status: "success" as const,
            link,
            originalValue: value,
            contentType: type,
          };
        })
      );

      const newLinks: Link[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.status === "duplicate") {
            duplicateCount++;
          } else if (result.value.status === "success") {
            successCount++;
            newLinks.push(result.value.link);
          }
        } else {
          failureCount++;
        }
      });

      if (newLinks.length > 0) {
        setLinks((prev) => [...newLinks, ...prev]);
      }

      // Background metadata enrichment for URLs
      results.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.status === "success" &&
          result.value.contentType === "url"
        ) {
          const { link, originalValue } = result.value;

          (async () => {
            try {
              const metadataResponse = await fetch("/api/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: originalValue }),
              });

              if (metadataResponse.ok) {
                const data = await metadataResponse.json();
                const metadata = data.metadata;

                const updateResponse = await fetch(`/api/links/${link.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: metadata?.title || originalValue,
                    favicon_url: metadata?.favicon || null,
                    og_image_url: metadata?.ogImage || null,
                    description: metadata?.description || null,
                  }),
                });

                if (updateResponse.ok) {
                  const { link: updatedLink } = await updateResponse.json();
                  setLinks((prev) =>
                    prev.map((l) => (l.id === link.id ? updatedLink : l))
                  );
                }
              }
            } catch (error) {
              console.error(
                "Error fetching metadata for",
                originalValue,
                error
              );
            }
          })();
        }
      });

      // Show summary toast
      if (items.length === 1) {
        if (successCount === 1) {
          const type = items[0].type;
          toast.success(
            type === "color"
              ? "Color saved successfully"
              : "Link saved successfully"
          );
        } else if (duplicateCount === 1) {
          const type = items[0].type;
          const message =
            type === "color"
              ? "This color is already in your list"
              : type === "url"
              ? "This link is already in your list"
              : "This item is already in your list";
          toast(message);
        } else {
          toast.error("Failed to save");
        }
      } else {
        if (successCount > 0 && duplicateCount === 0 && failureCount === 0) {
          toast.success(
            `${successCount} ${
              successCount === 1 ? "link" : "links"
            } added successfully`
          );
        } else if (successCount > 0 && duplicateCount > 0) {
          toast(
            `${successCount} ${
              successCount === 1 ? "link" : "links"
            } added, ${duplicateCount} ${
              duplicateCount === 1 ? "was" : "were"
            } already in your list`
          );
        } else if (duplicateCount > 0 && successCount === 0) {
          toast(
            `${duplicateCount} ${
              duplicateCount === 1 ? "link was" : "links were"
            } already in your list`
          );
        } else if (failureCount > 0) {
          if (successCount > 0) {
            toast(
              `${successCount} ${
                successCount === 1 ? "link" : "links"
              } added, ${failureCount} failed`
            );
          } else {
            toast.error("Failed to add links");
          }
        }
      }
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
