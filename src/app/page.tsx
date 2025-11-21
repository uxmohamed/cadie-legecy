"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { canonicalizeContent } from "@/lib/canonicalize";
import type { Link } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { DetectedContent } from "@/lib/content-detector";
import { RichTextModal } from "@/components/rich-text-modal";
import type { SerializedEditorState } from "lexical";
import { createInitialRichTextState } from "@/lib/rich-text-utils";

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [links, setLinks] = React.useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [fetchingLinks, setFetchingLinks] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const [richTextModalOpen, setRichTextModalOpen] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<Link | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth");
        return;
      }
      
      setUser(user);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

  React.useEffect(() => {
    if (!user) return;

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
  }, [user]);

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

  const handleDeleteLink = React.useCallback(async (id: string) => {
    // Optimistic update - remove immediately
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
  }, [showToast, refreshLinks]);

  const handleArchiveLink = React.useCallback(async (id: string) => {
    // Optimistic update - remove immediately
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
  }, [showToast, refreshLinks]);

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

  const handleSaveRichText = async (content: SerializedEditorState) => {
    if (!editingLink) return;

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
      
      // Update the link in the list
      setLinks((prev) =>
        prev.map((l) => (l.id === editingLink.id ? updatedLink : l))
      );

      // Toast removed - using auto-save indicator in modal instead
    } catch (error) {
      console.error("Error saving rich text:", error);
      showToast("Failed to save rich text", "error");
      throw error;
    }
  };

  const handlePinLink = React.useCallback(async (id: string) => {
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

      showToast("Link pinned", "success");
    } catch (error) {
      console.error("Error pinning link:", error);
      showToast("Failed to pin link", "error");
      await refreshLinks();
    }
  }, [showToast, refreshLinks]);

  const handleUnpinLink = React.useCallback(async (id: string) => {
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

      showToast("Link unpinned", "success");
    } catch (error) {
      console.error("Error unpinning link:", error);
      showToast("Failed to unpin link", "error");
      await refreshLinks();
    }
  }, [showToast, refreshLinks]);

  const handleSubmit = async (items: DetectedContent[]) => {
    if (items.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Track results for summary message
      let successCount = 0;
      let duplicateCount = 0;
      let failureCount = 0;
      
      // Process ALL links in parallel with two-phase approach:
      // Phase 1: Immediate DB insert (collect all links first)
      // Phase 2: Batch UI update, then background metadata fetching
      const results = await Promise.allSettled(
        items.map(async ({ value, type }) => {
          // Check for duplicates using smart canonicalization
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

          // PHASE 1: Immediate DB insert with minimal data
          const requestBody: Record<string, unknown> = {
            url: value,
            title: value, // Use URL/color as temporary title
            content_type: type,
          };

          if (type === "color") {
            requestBody.color_value = value;
          }

          // Create the link in DB immediately
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

          return { status: "success" as const, link, originalValue: value, contentType: type };
        })
      );

      // Collect all successfully created links
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
      
      // PHASE 2: Batch UI update - Add all new links at once (no race condition!)
      if (newLinks.length > 0) {
        setLinks((prev) => [...newLinks, ...prev]);
      }

      // PHASE 3: Background metadata enrichment for URLs (non-blocking)
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.status === "success" && result.value.contentType === "url") {
          const { link, originalValue } = result.value;
          
          // Fetch metadata async - don't await, let it run in background
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
                
                // Update DB with metadata
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
                  // Update UI with enriched data
                  setLinks((prev) => 
                    prev.map((l) => (l.id === link.id ? updatedLink : l))
                  );
                }
              }
            } catch (error) {
              console.error("Error fetching metadata for", originalValue, error);
              // Silent fail - link is already saved and displayed
            }
          })();
        }
      });
      
      // Show summary toast message
      if (items.length === 1) {
        // Single item - use simple messages
        if (successCount === 1) {
          const type = items[0].type;
          showToast(
            type === "color" ? "Color saved successfully" : "Link saved successfully",
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
        // Multiple items - show summary
        if (successCount > 0 && duplicateCount === 0 && failureCount === 0) {
          showToast(`${successCount} ${successCount === 1 ? "link" : "links"} added successfully`, "success");
        } else if (successCount > 0 && duplicateCount > 0) {
          showToast(
            `${successCount} ${successCount === 1 ? "link" : "links"} added, ${duplicateCount} ${duplicateCount === 1 ? "was" : "were"} already in your list`,
            "success"
          );
        } else if (duplicateCount > 0 && successCount === 0) {
          showToast(`${duplicateCount} ${duplicateCount === 1 ? "link was" : "links were"} already in your list`, "info");
        } else if (failureCount > 0) {
          if (successCount > 0) {
            showToast(
              `${successCount} ${successCount === 1 ? "link" : "links"} added, ${failureCount} failed`,
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-8 relative z-30">
          <Logo className="text-neutral-200" />
          <UserMenu user={user} />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-8">
            <div className="sticky top-0 z-20 bg-[#fafafa] pt-8 pb-4 relative">
              <CaptureInput 
                onSubmit={handleSubmit} 
                onSearch={handleSearch}
                isLoading={isLoading} 
              />
            </div>
            {fetchingLinks ? (
              <LinkListSkeleton />
            ) : (
              <LinkList 
                links={filteredLinks}
                onDelete={handleDeleteLink}
                onArchive={handleArchiveLink}
                onEdit={handleEditLink}
                onCopyUrl={handleCopyUrl}
                onPin={handlePinLink}
                onUnpin={handleUnpinLink}
              />
            )}
          </div>
        </div>
      </main>
      {editingLink && (
        <RichTextModal
          isOpen={richTextModalOpen}
          onClose={() => {
            setRichTextModalOpen(false);
            setEditingLink(null);
          }}
          onSave={handleSaveRichText}
          initialContent={(editingLink.rich_text_content as SerializedEditorState | null) || undefined}
          linkId={editingLink.id}
        />
      )}
    </div>
  );
}
