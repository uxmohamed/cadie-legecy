"use client";

import * as React from "react";

import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { Dock } from "@/components/dock";
import { BackgroundTint } from "@/components/background-tint";
import { useCategories } from "@/hooks/use-categories";
import { useLinks } from "@/features/links/hooks";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { getDefaultAvatar } from "@/lib/avatar";
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { IconPlus, IconSearch, IconDots } from "@tabler/icons-react";
import { Kbd } from "@/components/ui/kbd";
import {
  detectMultipleContentTypes,
  type DetectedContent,
} from "@/lib/content-detector";
import { useShortcuts } from "@/components/shortcut-context";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(null);
  const [sortBy, setSortBy] = React.useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [addPopoverOpen, setAddPopoverOpen] = React.useState(false);
  const [addInputValue, setAddInputValue] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showTopMask, setShowTopMask] = React.useState(false);
  const [showBottomMask, setShowBottomMask] = React.useState(true);
  const { categories } = useCategories(!!user);
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  const filters = React.useMemo(() => {
    if (selectedCategoryId === "trash") return { is_deleted: true };
    return { is_archived: false };
  }, [selectedCategoryId]);

  const {
    filteredLinks,
    isLoading,
    fetchingLinks,
    hasInitiallyLoaded,
    handleSearch,
    handleSubmit,
    handleDeleteLink,
    handleCopyUrl,
    handleEditLink,
    handlePinLink,
    handleUnpinLink,
    handleBatchDeleteLinks,
    handleBatchPinLinks,
    handleBatchUnpinLinks,
  } = useLinks(!!user, filters, user.id);

  // Sort links based on current sort settings, maintaining pinned/unpinned grouping
  const sortedLinks = React.useMemo(() => {
    const pinned = filteredLinks.filter((link) => link.is_pinned);
    const unpinned = filteredLinks.filter((link) => !link.is_pinned);

    const sortFunction = (
      a: (typeof filteredLinks)[0],
      b: (typeof filteredLinks)[0]
    ) => {
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

  const handleSortChange = React.useCallback(
    (newSortBy: "date" | "title", newOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newOrder);
    },
    []
  );

  const handleSearchClick = React.useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Auto-focus add input when popover opens
  React.useEffect(() => {
    if (addPopoverOpen && addInputRef.current) {
      const timer = setTimeout(() => {
        addInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [addPopoverOpen]);

  // Handle add submit
  const handleAddSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!addInputValue.trim() || isLoading) return;

      const detectedItems = detectMultipleContentTypes(addInputValue);
      if (detectedItems.length > 0) {
        handleSubmit(detectedItems);
        setAddInputValue("");
        setAddPopoverOpen(false);
      }
    },
    [addInputValue, isLoading, handleSubmit]
  );

  const handleAddInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddInputValue(e.target.value);
    },
    []
  );

  const handleAddKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setAddInputValue("");
        setAddPopoverOpen(false);
      }
    },
    []
  );

  // Handle search input
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);
      handleSearch(newValue);
    },
    [handleSearch]
  );

  const handleSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchValue("");
        handleSearch("");
        searchInputRef.current?.blur();
      }
    },
    [handleSearch]
  );

  // Register keyboard shortcuts
  React.useEffect(() => {
    registerShortcut({
      key: "c",
      description: "Open add popover",
      category: "Global",
      action: () => {
        setAddPopoverOpen(true);
      },
    });

    registerShortcut({
      key: "/",
      description: "Focus search",
      category: "Global",
      action: () => {
        searchInputRef.current?.focus();
      },
    });

    registerShortcut({
      key: "T",
      description: "Switch to Trash view",
      category: "Navigation",
      action: () => {
        setSelectedCategoryId("trash");
      },
    });

    registerShortcut({
      key: "A",
      description: "Switch to All Items view",
      category: "Navigation",
      action: () => {
        setSelectedCategoryId(null);
      },
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Handle Shift+T for Trash view
      if (e.shiftKey && e.key === "T") {
        const target = e.target as HTMLElement;
        const isInputFocused =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isInputFocused) {
          e.preventDefault();
          setSelectedCategoryId("trash");
        }
      }

      // Handle Shift+A for All Items view
      if (e.shiftKey && e.key === "A") {
        const target = e.target as HTMLElement;
        const isInputFocused =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isInputFocused) {
          e.preventDefault();
          setSelectedCategoryId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unregisterShortcut("c");
      unregisterShortcut("/");
    };
  }, [registerShortcut, unregisterShortcut]);

  const avatarSrc =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    getDefaultAvatar(user.id);

  // Handle scroll to update mask visibility
  const handleScrollContainer = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Show top mask when scrolled down more than 10px
    setShowTopMask(scrollTop > 10);
    // Show bottom mask when not at bottom
    setShowBottomMask(scrollTop < scrollHeight - clientHeight - 10);
  };

  return (
    <BackgroundTint avatarSrc={avatarSrc}>
      <div className="h-screen flex flex-col overflow-hidden relative z-10">
        {/* Single scroll container - everything scrolls together, header is sticky inside */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScrollContainer}
          className="flex-1 overlay-scroll"
        >
          {/* Sticky Header Zone */}
          <div className="sticky top-0 z-20 bg-[var(--bg-pure-white)]">
            {/* Top Header Bar */}
            <header className="flex h-16 items-center justify-between px-8">
              <Logo />
              <UserMenu user={user} />
            </header>

            {/* Control Bar */}
            <div className="mx-auto w-full max-w-4xl px-8">
              <div className="flex items-center justify-between pt-2 pb-6">
                {/* Left side: Add button + All items */}
                <div className="flex items-center gap-4">
                  <button
                    className="text-[22px] font-[570] leading-[32px] tracking-[-0.16px] text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                    style={{ fontStyle: "normal" }}
                    aria-label="All Items"
                  >
                    All Items
                  </button>
                </div>
                {/* Right side: Search + Options */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none z-10" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchValue}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search..."
                      className="h-9 w-[250px] py-0 pl-[26px] pr-[22px] rounded-lg outline-none placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)] bg-[var(--bg-field-light)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2 transition-shadow text-sm font-[470] tracking-[-0.1px]"
                      aria-label="Search"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center">
                      <Kbd className="h-5 px-1.5 text-[10px] text-[var(--text-tertiary)] flex items-center justify-center">
                        /
                      </Kbd>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-md bg-[var(--bg-field-light)] hover:bg-[var(--bg-field-hover)]"
                    aria-label="Options"
                  >
                    <IconDots className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Column Headers */}
            <div className="mx-auto w-full max-w-4xl px-8">
              <div className="grid grid-cols-[1fr_150px] gap-1 items-center text-xs font-medium text-[var(--text-tertiary)] select-none pt-2 pb-3 border-b border-[var(--border-tertiary)]">
                <div>Title</div>
                <div className="text-right">Created</div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="mx-auto w-full max-w-4xl px-8 pb-28">
            {/* Offset wrapper to align list items with headers */}
            <div className="-mx-2">
              {/* List Content */}
              {fetchingLinks || !hasInitiallyLoaded ? (
                <LinkListSkeleton />
              ) : (
                <>
                  {selectedCategoryId === "trash" && (
                    <div className="mx-2 mb-4 rounded-md bg-[var(--accent-yellow-secondary)]/10 p-3 text-sm text-[var(--accent-yellow-primary)] border border-[var(--accent-yellow-secondary)]/30">
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
                    onBatchPin={handleBatchPinLinks}
                    onBatchUnpin={handleBatchUnpinLinks}
                    isTrashView={selectedCategoryId === "trash"}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade mask overlay - fixed position */}
        <div 
          className="fixed bottom-0 left-0 right-0 h-24 z-10 pointer-events-none transition-opacity duration-150"
          style={{
            background: 'linear-gradient(to top, var(--bg-pure-white), transparent)',
            opacity: showBottomMask ? 1 : 0,
          }}
        />

        {/* Dock */}
        <Dock
          onAddSubmit={handleSubmit}
          onSearchClick={handleSearchClick}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          isLoading={isLoading}
          selectedCategoryId={selectedCategoryId}
          onViewChange={setSelectedCategoryId}
          allItemsCount={
            selectedCategoryId !== "trash" ? filteredLinks.length : undefined
          }
        />
      </div>
    </BackgroundTint>
  );
}
