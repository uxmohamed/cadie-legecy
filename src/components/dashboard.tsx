"use client";

import * as React from "react";

import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { Dock } from "@/components/dock";
import { useCategories } from "@/hooks/use-categories";
import { useLinks } from "@/features/links/hooks";
import type { User } from "@supabase/supabase-js";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const searchFocusFnRef = React.useRef<(() => void) | null>(null);
  const { categories } = useCategories(!!user);

  const filters = React.useMemo(() => {

    if (selectedCategoryId === "trash") return { is_deleted: true };
    return { is_archived: false };
  }, [selectedCategoryId]);

  const {
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
  } = useLinks(!!user, filters);

  // Sort links based on current sort settings, maintaining pinned/unpinned grouping
  const sortedLinks = React.useMemo(() => {
    const pinned = filteredLinks.filter((link) => link.is_pinned);
    const unpinned = filteredLinks.filter((link) => !link.is_pinned);

    const sortFunction = (a: typeof filteredLinks[0], b: typeof filteredLinks[0]) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // sortBy === "title"
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (sortOrder === "asc") {
          return titleA.localeCompare(titleB);
        } else {
          return titleB.localeCompare(titleA);
        }
      }
    };

    // Sort pinned and unpinned separately
    pinned.sort(sortFunction);
    unpinned.sort(sortFunction);

    // Combine: pinned first, then unpinned (maintaining grouping)
    return [...pinned, ...unpinned];
  }, [filteredLinks, sortBy, sortOrder]);

  const handleSortChange = React.useCallback((newSortBy: "date" | "title", newOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newOrder);
  }, []);

  const handleSearchClick = React.useCallback(() => {
    searchFocusFnRef.current?.();
  }, []);

  const handleFocusRequest = React.useCallback((focusFn: () => void) => {
    searchFocusFnRef.current = focusFn;
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-l0-solid)]">
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-8 relative z-30">
          <Logo />
          <UserMenu user={user} />
        </header>
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="mx-auto w-full max-w-4xl px-8">
            <div className="sticky top-0 z-20 bg-[var(--bg-l0-solid)] pt-8 pb-4">
              <CaptureInput
                onSearch={handleSearch}
                isLoading={isLoading}
                searchOnly
                onFocusRequest={handleFocusRequest}
              />
            </div>
            {fetchingLinks ? (
              <LinkListSkeleton />
            ) : (
              <>
                {selectedCategoryId === "trash" && (
                  <div className="mb-4 rounded-md bg-[var(--accent-yellow-secondary)]/10 p-3 text-sm text-[var(--accent-yellow-primary)] border border-[var(--accent-yellow-secondary)]/30">
                    Items in the Trash are permanently deleted after 60 days.
                  </div>
                )}
                <LinkList
                  links={sortedLinks}
                  onDelete={handleDeleteLink}

                  onEdit={handleEditLink}
                  onCopyUrl={handleCopyUrl}
                  onPin={handlePinLink}
                  onUnpin={handleUnpinLink}
                  onBatchDelete={handleBatchDeleteLinks}

                  isTrashView={selectedCategoryId === "trash"}
                />
              </>
            )}
          </div>
        </div>
      </main>
      <Dock
        onAddSubmit={handleSubmit}
        onSearchClick={handleSearchClick}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
      />
    </div>
  );
}
