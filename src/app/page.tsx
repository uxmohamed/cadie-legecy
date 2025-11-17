"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { canonicalizeContent } from "@/lib/canonicalize";
import type { Link } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { DetectedContent } from "@/lib/content-detector";

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [links, setLinks] = React.useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [fetchingLinks, setFetchingLinks] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
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
      
      // Refresh links on error to restore the item
      try {
        const response = await fetch("/api/links?is_archived=false");
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links || []);
        }
      } catch (refreshError) {
        console.error("Error refreshing links:", refreshError);
      }
    }
  }, [showToast]);

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
      
      // Refresh links on error to restore the item
      try {
        const response = await fetch("/api/links?is_archived=false");
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links || []);
        }
      } catch (refreshError) {
        console.error("Error refreshing links:", refreshError);
      }
    }
  }, [showToast]);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("URL copied to clipboard", "success");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      showToast("Failed to copy URL", "error");
    }
  };

  const handleEditLink = (link: Link) => {
    showToast("Edit functionality coming soon", "info");
  };

  const handleSubmit = async (items: DetectedContent[]) => {
    if (items.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Track results for summary message
      let successCount = 0;
      let duplicateCount = 0;
      let failureCount = 0;
      const addedLinks: Link[] = [];
      
      // Determine if we should use parallel or sequential processing
      // Use parallel for small batches (<=5 URLs), sequential for larger batches
      const useParallel = items.length <= 5;
      
      if (useParallel) {
        // Parallel processing for small batches
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

            // Extract metadata if it's a URL
            let metadata = null;
            if (type === "url") {
              const metadataResponse = await fetch("/api/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: value }),
              });
              
              if (metadataResponse.ok) {
                const data = await metadataResponse.json();
                metadata = data.metadata;
              }
            }

            // Prepare the request body
            const requestBody: Record<string, unknown> = {
              url: value,
              title: type === "color" ? value : (metadata?.title || value),
              content_type: type,
            };

            if (type === "color") {
              requestBody.color_value = value;
            } else if (type === "url") {
              requestBody.favicon_url = metadata?.favicon;
              requestBody.og_image_url = metadata?.ogImage;
              requestBody.description = metadata?.description;
            }

            // Create the link
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
            return { status: "success" as const, link };
          })
        );

        // Process results
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            if (result.value.status === "duplicate") {
              duplicateCount++;
            } else if (result.value.status === "success") {
              successCount++;
              addedLinks.push(result.value.link);
            }
          } else {
            failureCount++;
          }
        });
      } else {
        // Sequential processing for large batches
        for (const { value, type } of items) {
          try {
            // Check for duplicates
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
              duplicateCount++;
              continue;
            }

            // Extract metadata if it's a URL
            let metadata = null;
            if (type === "url") {
              const metadataResponse = await fetch("/api/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: value }),
              });
              
              if (metadataResponse.ok) {
                const data = await metadataResponse.json();
                metadata = data.metadata;
              }
            }

            // Prepare the request body
            const requestBody: Record<string, unknown> = {
              url: value,
              title: type === "color" ? value : (metadata?.title || value),
              content_type: type,
            };

            if (type === "color") {
              requestBody.color_value = value;
            } else if (type === "url") {
              requestBody.favicon_url = metadata?.favicon;
              requestBody.og_image_url = metadata?.ogImage;
              requestBody.description = metadata?.description;
            }

            // Create the link
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
            successCount++;
            addedLinks.push(link);
          } catch (error) {
            console.error("Error creating link:", error);
            failureCount++;
          }
        }
      }
      
      // Add all new links to the list
      if (addedLinks.length > 0) {
        setLinks((prev) => [...addedLinks, ...prev]);
      }
      
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
        <header className="flex h-24 items-center justify-between border-b border-neutral-200 px-8">
          <div className="flex-1 max-w-4xl">
            <CaptureInput 
              onSubmit={handleSubmit} 
              onSearch={handleSearch}
              isLoading={isLoading} 
            />
          </div>
          <div className="ml-6">
            <UserMenu user={user} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-8 pt-12">
            {fetchingLinks ? (
              <LinkListSkeleton />
            ) : (
              <LinkList 
                links={filteredLinks}
                onDelete={handleDeleteLink}
                onArchive={handleArchiveLink}
                onEdit={handleEditLink}
                onCopyUrl={handleCopyUrl}
              />
            )}
        </div>
        </div>
      </main>
    </div>
  );
}
