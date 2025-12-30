"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import { LogoIcon } from "@/components/logo-icon";
import { Dock } from "@/components/dock";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconSearch, IconDots, IconArrowUp, IconArrowDown, IconCircleCheckFilled } from "@tabler/icons-react";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { useShortcuts } from "@/components/shortcut-context";

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
  selectedCategoryId: string | null;
  onViewChange: (view: string | null) => void;
  sortBy: "date" | "title";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: "date" | "title") => void;
  isAddingItem: boolean;
  onToggleAddMode: () => void;
  selectedCount: number;
  selectedLinks: Link[];
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
}

export function DashboardShell({
  user,
  children,
  selectedCategoryId,
  onViewChange,
  sortBy,
  sortOrder,
  onSortChange,
  isAddingItem,
  onToggleAddMode,
  selectedCount,
  selectedLinks,
  onClearSelection,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
}: DashboardShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  const isTrashView = selectedCategoryId === "trash";
  const searchValue = searchParams.get("q") || "";

  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const params = new URLSearchParams(searchParams.toString());

      if (newValue) {
        params.set("q", newValue);
      } else {
        params.delete("q");
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handleSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        router.replace(`?${params.toString()}`, { scroll: false });
        searchInputRef.current?.blur();
      }
    },
    [searchParams, router]
  );

  const handleSortChange = React.useCallback(
    (newSortBy: "date" | "title") => {
      onSortChange(newSortBy);
    },
    [onSortChange]
  );

  // Register keyboard shortcuts
  React.useEffect(() => {
    registerShortcut({
      key: "d",
      description: "Add new item",
      category: "Global",
      action: () => {
        if (selectedCategoryId !== "trash") {
          onToggleAddMode();
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
        onViewChange("trash");
      },
    });

    registerShortcut({
      key: "1",
      description: "Switch to All Items view",
      category: "Navigation",
      action: () => {
        onViewChange(null);
      },
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.shiftKey && e.key === "T") {
        const target = e.target as HTMLElement;
        const isInputFocused =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isInputFocused) {
          e.preventDefault();
          onViewChange("trash");
        }
      }

      if (e.key === "1") {
        const target = e.target as HTMLElement;
        const isInputFocused =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isInputFocused) {
          e.preventDefault();
          onViewChange(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unregisterShortcut("d");
      unregisterShortcut("/");
    };
  }, [registerShortcut, unregisterShortcut, selectedCategoryId, onToggleAddMode, onViewChange]);

  return (
    <div className="min-h-screen bg-[var(--bg-main-container)] relative">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-20 bg-[var(--bg-main-container)]">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          <button
            onClick={() => onViewChange(null)}
            className={`focus:outline-none ${selectedCategoryId !== null ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label="Go to All Items"
          >
            <LogoIcon className="h-8 w-8" />
          </button>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] border border-dashed border-[var(--border-primary)] rounded-full">
            Beta
          </span>
          <div className="flex-1" />
          <UserMenu user={user} />
        </header>

        {/* Control Bar */}
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between gap-2 pt-2 pb-4 sm:pb-6">
            {/* Left side: Add button + All items */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Add Button */}
              {!isTrashView && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleAddMode}
                  className="h-9 w-9 rounded-md border-[var(--border-primary)] bg-transparent dark:bg-[var(--bg-field-light)] hover:bg-[var(--bg-field-hover)]"
                  aria-label="Add item"
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              )}

              {/* Vertical Divider */}
              {!isTrashView && (
                <div className="h-8 w-px bg-[var(--border-secondary)]" />
              )}

              <div className="flex items-center gap-2">
                <button
                  className="not-italic text-lg sm:text-[22px] font-[570] leading-tight sm:leading-[32px] tracking-[-0.16px] text-[var(--text-primary)] hover:text-[var(--text-primary)] truncate"
                  aria-label={isTrashView ? "Trash" : "All Items"}
                >
                  {isTrashView ? "Trash" : "All Items"}
                </button>
                {isTrashView && (
                  <Badge variant="secondary" className="bg-[var(--bg-field-light)] px-2 py-0.75 text-[var(--text-tertiary)] rounded-full">
                    Auto-deletes in 60 days
                  </Badge>
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

              {/* Options Menu */}
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
                        handleSortChange("date");
                      }}
                      className={`cursor-pointer rounded-xl ${sortBy === "date" ? "bg-[rgba(255,255,255,0.1)]" : ""}`}
                    >
                      {sortBy === "date" ? (
                        <IconCircleCheckFilled className="w-5 h-5 text-white mr-2" />
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
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSortChange("title");
                      }}
                      className={`cursor-pointer rounded-xl ${sortBy === "title" ? "bg-[rgba(255,255,255,0.1)]" : ""}`}
                    >
                      {sortBy === "title" ? (
                        <IconCircleCheckFilled className="w-5 h-5 text-white mr-2" />
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
          {/* Divider line */}
          <div className="-mx-6 border-b border-[var(--border-tertiary)]" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-6 pb-32 sm:pb-28">
        <div className="-mx-2">
          {children}
        </div>
      </div>

      {/* Bottom fade mask */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 z-10 pointer-events-none bg-gradient-to-t from-[var(--bg-main-container)] to-transparent"
      />

      {/* Dock */}
      <Dock
        selectedCategoryId={selectedCategoryId}
        onViewChange={onViewChange}
        selectedCount={selectedCount}
        onClearSelection={onClearSelection}
        onBatchDelete={onBatchDelete}
        onBatchRestore={onBatchRestore}
        onBatchPermanentDelete={onBatchPermanentDelete}
        onBatchPin={onBatchPin}
        onBatchUnpin={onBatchUnpin}
        selectedLinks={selectedLinks}
        isTrashView={isTrashView}
      />
    </div>
  );
}
