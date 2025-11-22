"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import { canonicalizeContent } from "@/lib/canonicalize";
import type { Link } from "@/types";
import type { DetectedContent } from "@/lib/content-detector";
import type { SerializedEditorState } from "lexical";

export function useLinks(isAuthenticated: boolean) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [links, setLinks] = React.useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [fetchingLinks, setFetchingLinks] = React.useState(true);
  const { showToast } = useToast();

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
          showToast("Failed to load links", "error");
        }
      } catch (error) {
        console.error("Error fetching links:", error);
        showToast("Failed to load links", "error");
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

        showToast("Link deleted", "success");
      } catch (error) {
        console.error("Error deleting link:", error);
        showToast("Failed to delete link", "error");
        await refreshLinks();
      }
    },
    [showToast, refreshLinks]
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

        showToast("Link archived", "success");
      } catch (error) {
        console.error("Error archiving link:", error);
        showToast("Failed to archive link", "error");
        await refreshLinks();
      }
    },
    [showToast, refreshLinks]
  );

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("URL copied to clipboard", "success");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      showToast("Failed to copy URL", "error");
    }
  };

  const handleEditLink = () => {
    showToast("Edit functionality coming soon", "info");
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
      showToast("Failed to save rich text", "error");
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

        showToast("Link pinned", "success");
      } catch (error) {
        console.error("Error pinning link:", error);
        showToast("Failed to pin link", "error");
        await refreshLinks();
      }
    },
    [showToast, refreshLinks]
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

        showToast("Link unpinned", "success");
      } catch (error) {
        console.error("Error unpinning link:", error);
        showToast("Failed to unpin link", "error");
        await refreshLinks();
      }
    },
    [showToast, refreshLinks]
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
          showToast(
            type === "color"
              ? "Color saved successfully"
              : "Link saved successfully",
            "success"
          );
        } else if (duplicateCount === 1) {
          const type = items[0].type;
          const message =
            type === "color"
              ? "This color is already in your list"
              : type === "url"
              ? "This link is already in your list"
              : "This item is already in your list";
          showToast(message, "info");
        } else {
          showToast("Failed to save", "error");
        }
      } else {
        if (successCount > 0 && duplicateCount === 0 && failureCount === 0) {
          showToast(
            `${successCount} ${
              successCount === 1 ? "link" : "links"
            } added successfully`,
            "success"
          );
        } else if (successCount > 0 && duplicateCount > 0) {
          showToast(
            `${successCount} ${
              successCount === 1 ? "link" : "links"
            } added, ${duplicateCount} ${
              duplicateCount === 1 ? "was" : "were"
            } already in your list`,
            "success"
          );
        } else if (duplicateCount > 0 && successCount === 0) {
          showToast(
            `${duplicateCount} ${
              duplicateCount === 1 ? "link was" : "links were"
            } already in your list`,
            "info"
          );
        } else if (failureCount > 0) {
          if (successCount > 0) {
            showToast(
              `${successCount} ${
                successCount === 1 ? "link" : "links"
              } added, ${failureCount} failed`,
              "success"
            );
          } else {
            showToast("Failed to add links", "error");
          }
        }
      }
    } catch (error) {
      console.error("Error creating links:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to save",
        "error"
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
