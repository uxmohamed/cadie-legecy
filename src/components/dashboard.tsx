"use client";

import * as React from "react";

import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { Dock } from "@/components/dock";
import { useCategories } from "@/hooks/use-categories";
import { useLinks } from "@/features/links/hooks";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconSearch, IconDots, IconArrowUp, IconArrowDown, IconCheck } from "@tabler/icons-react";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  detectMultipleContentTypes,
  type DetectedContent,
} from "@/lib/content-detector";
import { toast } from "sonner";
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
  const [isAddingItem, setIsAddingItem] = React.useState(false);
  const [addInputValue, setAddInputValue] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
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
    handleRestoreLink,
    handlePermanentDeleteLink,
    handleCopyUrl,
    handleEditLink,
    handleUpdateLink,
    handlePinLink,
    handleUnpinLink,
    handleBatchDeleteLinks,
    handleBatchRestoreLinks,
    handleBatchPermanentDeleteLinks,
    handleBatchPinLinks,
    handleBatchUnpinLinks,
    isLoadingMore,
    hasMore,
    loadMore,
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
    (newSortBy: "date" | "title") => {
      if (sortBy === newSortBy) {
        // Toggle order if same field
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        // New field, default to descending
        setSortBy(newSortBy);
        setSortOrder("desc");
      }
    },
    [sortBy, sortOrder]
  );

  const handleSearchClick = React.useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle inline add submit
  const handleInlineAddSubmit = React.useCallback(() => {
    if (!addInputValue.trim() || isLoading) return;

    const detectedItems = detectMultipleContentTypes(addInputValue);
    if (detectedItems.length > 0) {
      // Validate items
      const validItems = detectedItems.filter(item => {
        if (item.type === 'url') {
          // Basic URL validation
          try {
            const url = new URL(item.value);
            // Require TLD (dot in hostname) unless localhost
            return url.hostname === 'localhost' || url.hostname.includes('.');
          } catch {
            return false;
          }
        }
        return true; // Colors are already validated by detector
      });

      if (validItems.length === 0) {
        toast.error("Please enter a valid URL or color");
        return;
      }

      if (validItems.length < detectedItems.length) {
        toast.warning("Some invalid items were skipped");
      }

      handleSubmit(validItems);
      setAddInputValue("");
      setIsAddingItem(false);
    }
  }, [addInputValue, isLoading, handleSubmit]);

  // Handle inline add input change
  const handleInlineAddInputChange = React.useCallback((value: string) => {
    setAddInputValue(value);
  }, []);

  // Handle inline add cancel (when empty and click outside)
  const handleInlineAddCancel = React.useCallback(() => {
    setAddInputValue("");
    setIsAddingItem(false);
  }, []);

  // Toggle inline add mode
  const handleToggleAddMode = React.useCallback(() => {
    if (selectedCategoryId === "trash") return; // Don't allow adding in trash view
    setIsAddingItem((prev) => !prev);
  }, [selectedCategoryId]);

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
      description: "Add new item",
      category: "Global",
      action: () => {
        if (selectedCategoryId !== "trash") {
          setIsAddingItem(true);
        }
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

    registerShortcut({
      key: "1",
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

      // Handle '1' key for All Items view
      if (e.key === "1") {
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
    <div className="min-h-screen bg-[var(--bg-main-container)] relative">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-20 bg-[var(--bg-main-container)]">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`focus:outline-none ${selectedCategoryId !== null ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label="Go to All Items"
          >
            <Logo />
          </button>
          <UserMenu user={user} />
        </header>

        {/* Control Bar */}
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between gap-2 pt-2 pb-4 sm:pb-6">
            {/* Left side: Add button + All items */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Add Button (toggles inline add mode) */}
              {selectedCategoryId !== "trash" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleAddMode}
                  className="h-9 w-9 rounded-md border-[var(--border-secondary)] bg-transparent hover:bg-[var(--bg-field-hover-light)]"
                  aria-label="Add item"
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              )}

              {/* Vertical Divider - only show when Add button is visible */}
              {selectedCategoryId !== "trash" && (
                <div className="h-8 w-px bg-[var(--border-secondary)]" />
              )}

              <div className="flex items-center gap-2">
                <button
                  className="not-italic text-lg sm:text-[22px] font-[570] leading-tight sm:leading-[32px] tracking-[-0.16px] text-[var(--text-primary)] hover:text-[var(--text-primary)] truncate"
                  aria-label={selectedCategoryId === "trash" ? "Trash" : "All Items"}
                >
                  {selectedCategoryId === "trash" ? "Trash" : "All Items"}
                </button>
                {selectedCategoryId === "trash" && (
                  <Badge variant="secondary" className="bg-[var(--bg-field-light)] px-2 py-0.75 text-[var(--text-tertiary)] rounded-full">Auto-deletes in 60 days</Badge>
                )}
              </div>
            </div>
            {/* Right side: Search + Options */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  className="h-9 w-32 sm:w-48 md:w-[250px] py-0 pl-[26px] pr-[22px] rounded-lg outline-none placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)] bg-[var(--bg-field-light)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2 transition-shadow text-sm font-[470] tracking-[-0.1px]"
                  aria-label="Search"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 hidden sm:flex items-center">
                  <Kbd className="h-5 px-1.5 text-[10px] text-[var(--text-tertiary)] flex items-center justify-center">
                    /
                  </Kbd>
                </div>
              </div>
              
              {/* Options Menu with Sorting */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="hidden sm:flex h-9 w-9 rounded-md bg-[var(--bg-field-light)] hover:bg-[var(--bg-field-hover)]"
                    aria-label="Options"
                  >
                    <IconDots className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-[var(--overlay-text-secondary)]">
                      Sort by
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5 px-0.75 pb-0.75">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSortChange("title");
                      }}
                      className={`cursor-pointer rounded-xl ${sortBy === "title" ? "bg-[rgba(255,255,255,0.1)]" : ""}`}
                    >
                      {sortBy === "title" ? (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white mr-2">
                          <IconCheck className="h-3 w-3 text-black" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 mr-2" />
                      )}
                      Name
                      {sortBy === "title" && (
                        sortOrder === "asc" ? (
                          <IconArrowUp className="ml-auto h-4 w-4" />
                        ) : (
                          <IconArrowDown className="ml-auto h-4 w-4" />
                        )
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSortChange("date");
                      }}
                      className={`cursor-pointer rounded-xl ${sortBy === "date" ? "bg-[rgba(255,255,255,0.1)]" : ""}`}
                    >
                      {sortBy === "date" ? (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white mr-2">
                          <IconCheck className="h-3 w-3 text-black" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 mr-2" />
                      )}
                      Date Added
                      {sortBy === "date" && (
                        sortOrder === "asc" ? (
                          <IconArrowUp className="ml-auto h-4 w-4" />
                        ) : (
                          <IconArrowDown className="ml-auto h-4 w-4" />
                        )
                      )}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_150px] gap-1 items-center text-xs font-medium text-[var(--text-tertiary)] select-none pt-2 pb-3">
            <div>Title</div>
            <div className="text-right">Created</div>
          </div>
          {/* Divider line - extends wider than content */}
          <div className="-mx-6 border-b border-[var(--border-tertiary)]" />
        </div>
      </div>

      {/* Main Content Area (scrolls with page) */}
      <div
        ref={scrollContainerRef}
        className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-6 pb-32 sm:pb-28"
      >
        {/* Offset wrapper to align list items with headers */}
        <div className="-mx-2">
          {/* List Content */}
          {(!hasInitiallyLoaded && filteredLinks.length === 0) ? (
            <LinkListSkeleton />
          ) : (
            <>
              <LinkList
                links={sortedLinks}
                onDelete={handleDeleteLink}
                onRestore={handleRestoreLink}
                onPermanentDelete={handlePermanentDeleteLink}
                onEdit={handleEditLink}
                onCopy={handleCopyUrl}
                onPin={handlePinLink}
                onUnpin={handleUnpinLink}
                onBatchDelete={handleBatchDeleteLinks}
                onBatchRestore={handleBatchRestoreLinks}
                onBatchPermanentDelete={handleBatchPermanentDeleteLinks}
                onBatchPin={handleBatchPinLinks}
                onBatchUnpin={handleBatchUnpinLinks}
                onUpdate={handleUpdateLink}
                isTrashView={selectedCategoryId === "trash"}
                isAddingItem={isAddingItem}
                addInputValue={addInputValue}
                onAddInputChange={handleInlineAddInputChange}
                onAddSubmit={handleInlineAddSubmit}
                onAddCancel={handleInlineAddCancel}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            </>
          )}
        </div>
      </div>

      {/* Bottom fade mask overlay - fixed position */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-24 z-10 pointer-events-none transition-opacity duration-150 bg-gradient-to-t from-[var(--bg-pure-white)] to-transparent"
        style={{
          opacity: showBottomMask ? 1 : 0,
        }}
      />

      {/* Dock */}
      <Dock
        selectedCategoryId={selectedCategoryId}
        onViewChange={setSelectedCategoryId}
        allItemsCount={
          selectedCategoryId !== "trash" ? filteredLinks.length : undefined
        }
      />
    </div>
  );
}
