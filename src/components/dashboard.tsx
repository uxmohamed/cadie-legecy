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
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  IconPlus,
  IconSearch,
  IconDots,
} from "@tabler/icons-react";
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
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [addPopoverOpen, setAddPopoverOpen] = React.useState(false);
  const [addInputValue, setAddInputValue] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
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
  } = useLinks(!!user, filters, user.id);

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
  const handleAddSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!addInputValue.trim() || isLoading) return;

    const detectedItems = detectMultipleContentTypes(addInputValue);
    if (detectedItems.length > 0) {
      handleSubmit(detectedItems);
      setAddInputValue("");
      setAddPopoverOpen(false);
    }
  }, [addInputValue, isLoading, handleSubmit]);

  const handleAddInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddInputValue(e.target.value);
  }, []);

  const handleAddKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setAddInputValue("");
      setAddPopoverOpen(false);
    }
  }, []);

  // Handle search input
  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    handleSearch(newValue);
  }, [handleSearch]);

  const handleSearchKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchValue("");
      handleSearch("");
      searchInputRef.current?.blur();
    }
  }, [handleSearch]);

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

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-l0-solid)]">
      <main className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8 bg-[var(--bg-l0-solid)]">
          <Logo />
          <UserMenu user={user} />
        </header>
        {/* Control Bar */}
        <div className="sticky top-16 z-20 bg-[var(--bg-l0-solid)]">
          <div className="mx-auto w-full max-w-4xl px-8">
            <div className="flex items-center justify-between py-2 -mx-4 px-6">
              {/* Left side: Add button + All items */}
              <div className="flex items-center gap-4">
            <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-md"
                  aria-label="Add item"
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverPopup
                side="bottom"
                align="start"
                sideOffset={8}
                className="w-[420px] p-3"
              >
                <form onSubmit={handleAddSubmit} className="space-y-3">
                  <div className="px-2 text-sm font-[470] text-[var(--text-primary)]">
                    Add item
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={addInputRef}
                      type="text"
                      value={addInputValue}
                      onChange={handleAddInputChange}
                      onKeyDown={handleAddKeyDown}
                      placeholder="Add a link or color..."
                      disabled={isLoading}
                      unstyled
                      className="flex-1 rounded-lg bg-[var(--bg-l1-solid)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)] outline-none border border-[var(--border-primary)]"
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      disabled={!addInputValue.trim() || isLoading}
                      variant="default"
                      className="shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </form>
              </PopoverPopup>
            </Popover>
            <div className="h-6 w-px bg-[var(--border-primary)]" />
            <button
              className="text-[22px] font-[570] leading-[32px] tracking-[-0.16px] text-[var(--text-primary)] hover:text-[var(--text-primary)]"
              style={{ fontStyle: 'normal' }}
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
                className="h-9 w-[250px] py-0 pl-[26px] pr-[22px] rounded-lg outline-none placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)] bg-[var(--bg-field-light)]"
                aria-label="Search"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center">
                <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(0,0,0,0.06)] text-[var(--text-tertiary)] flex items-center justify-center">
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
        </div>
        <div className="pb-24">
          <div className="mx-auto w-full max-w-4xl px-8">
            {/* Title and Created at header - sticky */}
            <div className="sticky top-[116px] z-10 grid grid-cols-[1fr_150px] gap-1 items-center py-4 px-6 text-xs font-medium text-[var(--text-tertiary)] select-none bg-[var(--bg-l0-solid)] border-b border-[var(--border-tertiary)] -mx-4">
              <div>Title</div>
              <div className="text-right">Created</div>
            </div>
            {fetchingLinks || !hasInitiallyLoaded ? (
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
        selectedCategoryId={selectedCategoryId}
        onViewChange={setSelectedCategoryId}
        allItemsCount={selectedCategoryId !== "trash" ? filteredLinks.length : undefined}
      />
    </div>
  );
}
