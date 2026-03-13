"use client";

import * as React from "react";
import { UserMenu } from "@/components/user-menu";
import { LogoIcon } from "@/components/logo-icon";
import { Dock } from "@/components/dock";
import { ViewSwitcher } from "@/components/view-switcher";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconSearch, IconDots, IconArrowUp, IconArrowDown, IconCircleCheckFilled, IconLayoutList, IconLayoutGrid, IconUpload, IconPalette, IconNotes, IconAlertTriangle, IconFolder } from "@tabler/icons-react";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { useShortcuts } from "@/components/shortcut-context";
import { GlobalCommandMenu } from "@/components/global-command-menu";
import { useBillingQuery } from "@/features/billing/queries/use-billing-query";

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
  selectedCategoryId: string | null;
  onViewChange: (view: string | null) => void;
  sortBy: "date" | "title";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: "date" | "title") => void;
  isAddingItem: boolean;
  onOpenAddMode: (initialValue?: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  selectedLinks: Link[];
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  onBatchCopyLinks?: () => Promise<void>;
  onBatchMoveToSpace?: (spaceId: string) => Promise<void>;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  spaces?: Space[];
  onCreateSpace?: () => void;
  onEditSpace?: (space: Space) => void;
  onDeleteSpace?: (spaceId: string) => void;
  onUploadImages?: (files: File[]) => void;
  onUploadDocuments?: (files: File[]) => void;
  onCreateNote?: () => void;
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
  onOpenAddMode,
  searchQuery,
  onSearchChange,
  selectedCount,
  selectedLinks,
  onClearSelection,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  onBatchCopyLinks,
  onBatchMoveToSpace,
  viewMode,
  onViewModeChange,
  spaces,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  onUploadImages,
  onUploadDocuments,
  onCreateNote,
}: DashboardShellProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const { registerShortcut, unregisterShortcut, toggleHelp } = useShortcuts();
  const [pendingShortcut, setPendingShortcut] = React.useState<string | null>(null);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = React.useState(false);
  const pendingShortcutTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isTrashView = selectedCategoryId === "trash";
  const selectedSpace = spaces?.find(s => s.id === selectedCategoryId);
  const [isDraggingFiles, setIsDraggingFiles] = React.useState(false);
  const { billing } = useBillingQuery();
  const [isSubscriptionCelebrationOpen, setIsSubscriptionCelebrationOpen] = React.useState(false);
  const billingWarning = React.useMemo(() => {
    if (billing?.plan !== "starter" || !billing.entitlements.maxSavedItems) {
      return null;
    }

    const max = billing.entitlements.maxSavedItems;
    const current = billing.usage.totalSavedItems;
    const nearLimit = billing.warnings.near_starter_saved_items_limit;
    const atLimit = current >= max;

    if (!nearLimit && !atLimit) {
      return null;
    }

    return { nearLimit, atLimit, current, max };
  }, [billing]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const billingSuccess = url.searchParams.get("billing_success");
    if (billingSuccess !== "1" || !billing || billing.plan === "starter") return;

    const clearSuccessParam = () => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("billing_success");
      const query = nextUrl.searchParams.toString();
      const cleanUrl = `${nextUrl.pathname}${query ? `?${query}` : ""}${nextUrl.hash}`;
      window.history.replaceState(null, "", cleanUrl);
    };

    const status = billing.subscription.status || "unknown";
    const periodEnd = billing.subscription.current_period_end || "none";
    const celebrationKey = `billing_celebrated:${user.id}:${billing.plan}:${status}:${periodEnd}`;

    if (window.localStorage.getItem(celebrationKey) === "1") {
      clearSuccessParam();
      return;
    }

    window.localStorage.setItem(celebrationKey, "1");
    setIsSubscriptionCelebrationOpen(true);
    clearSuccessParam();
  }, [billing, user.id]);
  const dragCounterRef = React.useRef(0);
  const uploadInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    document.body.dataset.commandMenuOpen = isCommandMenuOpen ? "true" : "false";
    return () => {
      delete document.body.dataset.commandMenuOpen;
    };
  }, [isCommandMenuOpen]);

  const handleUploadInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const pdfFiles = files.filter((file) => file.type === "application/pdf");

      if (imageFiles.length > 0) {
        onUploadImages?.(imageFiles);
      }
      if (pdfFiles.length > 0) {
        onUploadDocuments?.(pdfFiles);
      }

      e.target.value = "";
    },
    [onUploadImages, onUploadDocuments]
  );
// Update URL immediately using history API (no navigation, instant URL update)
  const updateUrl = React.useCallback((value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, []);

  const handleSearchInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onSearchChange(value);
      updateUrl(value);
    },
    [onSearchChange, updateUrl]
  );

  const handleSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onSearchChange("");
        updateUrl("");
        searchInputRef.current?.blur();
      }
    },
    [onSearchChange, updateUrl]
  );

  const handleSortChange = React.useCallback(
    (newSortBy: "date" | "title") => {
      onSortChange(newSortBy);
    },
    [onSortChange]
  );

  // Register keyboard shortcuts
  React.useEffect(() => {
    const shortcutIds: string[] = [];

    shortcutIds.push(registerShortcut({
      key: "n",
      description: "Add new link",
      category: "Global",
      action: () => {
        if (selectedCategoryId !== "trash") {
          onOpenAddMode();
        }
      },
    }));

    shortcutIds.push(registerShortcut({
      key: "/",
      description: "Focus search",
      category: "Global",
      action: () => {
        searchInputRef.current?.focus();
      },
    }));

    shortcutIds.push(registerShortcut({
      key: "Cmd+f",
      description: "Focus search",
      category: "Global",
      allowInInput: true,
      action: () => {
        searchInputRef.current?.focus();
      },
    }));

    shortcutIds.push(registerShortcut({
      key: "Ctrl+f",
      description: "Focus search",
      category: "Global",
      allowInInput: true,
      action: () => {
        searchInputRef.current?.focus();
      },
    }));

    shortcutIds.push(registerShortcut({
      key: "Cmd+k",
      description: "Open command menu",
      category: "Global",
      allowInInput: true,
      priority: 100,
      action: () => setIsCommandMenuOpen((prev) => !prev),
    }));

    shortcutIds.push(registerShortcut({
      key: "Ctrl+k",
      description: "Open command menu",
      category: "Global",
      allowInInput: true,
      priority: 100,
      action: () => setIsCommandMenuOpen((prev) => !prev),
    }));

    shortcutIds.push(registerShortcut({
      key: "v",
      description: "Toggle view mode",
      category: "Global",
      action: () => {
        onViewModeChange(viewMode === "list" ? "grid" : "list");
      },
    }));

    shortcutIds.push(registerShortcut({
      key: "Shift+t",
      description: "Switch to Trash view",
      category: "Navigation",
      action: () => {
        onViewChange("trash");
      },
    }));

    shortcutIds.push(registerShortcut({
      key: "1",
      description: "Switch to All view",
      category: "Navigation",
      action: () => {
        onViewChange(null);
      },
    }));

    // Register shortcuts for spaces dynamically
    if (spaces && spaces.length > 0) {
      spaces.forEach((space, index) => {
        let shortcutKey: string;
        if (index < 8) {
          // First 8 spaces: shortcuts 2-9
          shortcutKey = String(index + 2);
          // Single key shortcuts (2-9)
          shortcutIds.push(registerShortcut({
            key: shortcutKey,
            description: `Switch to ${space.name} space`,
            category: "Navigation",
            action: () => {
              onViewChange(space.id);
            },
          }));
        }
        // Multi-key shortcuts (1B-9B, 1C-9C, etc.) are handled in handleKeyDown
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommandMenuOpen) {
        return;
      }

      // Handle Cmd+V / Ctrl+V for clipboard paste
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        const target = e.target as HTMLElement;
        const isInputFocused =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        // Only intercept if not in an input field and not in trash view
        if (!isInputFocused && selectedCategoryId !== "trash") {
          e.preventDefault();

          // Try reading clipboard items (supports images)
          if (navigator.clipboard.read) {
            navigator.clipboard.read().then((items) => {
              for (const item of items) {
                // Check for image types
                const imageType = item.types.find((t) => t.startsWith("image/"));
                if (imageType && onUploadImages) {
                  item.getType(imageType).then((blob) => {
                    const file = new File([blob], `pasted-image-${Date.now()}.${imageType.split("/")[1] || "png"}`, { type: imageType });
                    onUploadImages([file]);
                  });
                  return;
                }
              }
              // No image found, fall back to text
              navigator.clipboard.readText().then((text) => {
                if (text && text.trim()) {
                  onOpenAddMode(text.trim());
                }
              }).catch(() => {});
            }).catch(() => {
              // Fallback to readText
              navigator.clipboard.readText().then((text) => {
                if (text && text.trim()) {
                  onOpenAddMode(text.trim());
                }
              }).catch((err) => {
                console.debug("Clipboard read failed:", err);
              });
            });
          } else {
            // Fallback for browsers without clipboard.read()
            navigator.clipboard
              .readText()
              .then((text) => {
                if (text && text.trim()) {
                  onOpenAddMode(text.trim());
                }
              })
              .catch((err) => {
                console.debug("Clipboard read failed:", err);
              });
          }
        }
        return;
      }

      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputFocused) {
        return; // Don't handle shortcuts when typing in inputs
      }

      // Handle letter keys for multi-key shortcuts (1A-9A, 1B-9B, etc.)
      if (pendingShortcut && /^[a-z]$/i.test(e.key) && spaces && spaces.length > 8) {
        const numKey = parseInt(pendingShortcut);
        const letter = e.key.toUpperCase();
        const letterIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
        const spaceIndex = 8 + (letterIndex * 9) + (numKey - 1); // 1A -> index 8, 2A -> index 9, ..., 1B -> index 17, etc.
        if (spaces[spaceIndex]) {
          e.preventDefault();
          onViewChange(spaces[spaceIndex].id);
          setPendingShortcut(null);
          if (pendingShortcutTimeoutRef.current) {
            clearTimeout(pendingShortcutTimeoutRef.current);
          }
        }
        return;
      }

      // Handle number keys
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= 9) {
        // If we have more than 8 spaces, numbers can trigger multi-key shortcuts
        if (spaces && spaces.length > 8) {
          // Check if this number can be used for a multi-key shortcut (1B-9B, 1C-9C, etc.)
          // Calculate which spaces could use this number with a letter
          const hasMultiKeySpace = Array.from({ length: Math.ceil((spaces.length - 8) / 9) }, (_, i) => {
            const spaceIndex = 8 + (i * 9) + (numKey - 1);
            return spaces[spaceIndex] !== undefined;
          }).some(Boolean);

          // Check if this number can be used for a single-key shortcut
          const spaceIndexForSingleKey = numKey - 2; // 2 -> index 0, 3 -> index 1, etc.
          const hasSingleKeySpace = numKey >= 2 && numKey <= 8 && spaces[spaceIndexForSingleKey] !== undefined;

          if (hasMultiKeySpace || (numKey === 1 && spaces.length > 8)) {
            // Start waiting for letter key (B, C, D, etc.)
            e.preventDefault();
            setPendingShortcut(e.key);
            if (pendingShortcutTimeoutRef.current) {
              clearTimeout(pendingShortcutTimeoutRef.current);
            }
            pendingShortcutTimeoutRef.current = setTimeout(() => {
              // Timeout: execute single key action
              setPendingShortcut(null);
              if (numKey === 1) {
                onViewChange(null);
              } else if (hasSingleKeySpace) {
                onViewChange(spaces[spaceIndexForSingleKey].id);
              }
            }, 500); // Wait 500ms for letter key
            return;
          }
        }

        // Single key shortcuts
        if (numKey === 1) {
          e.preventDefault();
          onViewChange(null);
        } else if (numKey >= 2 && numKey <= 9 && spaces && spaces.length > 0) {
          const spaceIndex = numKey - 2; // 2 -> index 0, 3 -> index 1, etc.
          if (spaces[spaceIndex]) {
            e.preventDefault();
            onViewChange(spaces[spaceIndex].id);
          }
        }
      }

    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      shortcutIds.forEach(unregisterShortcut);
      if (pendingShortcutTimeoutRef.current) {
        clearTimeout(pendingShortcutTimeoutRef.current);
      }
    };
  }, [registerShortcut, unregisterShortcut, selectedCategoryId, onOpenAddMode, onViewChange, viewMode, onViewModeChange, spaces, pendingShortcut, onUploadImages, isCommandMenuOpen]);

  // Global drag-and-drop for image files
  React.useEffect(() => {
    if (isTrashView || (!onUploadImages && !onUploadDocuments)) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDraggingFiles(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDraggingFiles(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingFiles(false);

      const files = Array.from(e.dataTransfer?.files || []);
      const firstPdf = files.find((f) => f.type === "application/pdf");
      if (firstPdf) {
        onUploadDocuments?.([firstPdf]);
        return;
      }
      const firstImage = files.find((f) => f.type.startsWith("image/"));
      if (firstImage) {
        onUploadImages?.([firstImage]);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isTrashView, onUploadImages, onUploadDocuments]);

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-20 bg-bg">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          <button
            onClick={() => onViewChange(null)}
            className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg ${selectedCategoryId !== null ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label="Go to All Items"
          >
            <LogoIcon className="h-8 w-8" />
          </button>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium text-fg-muted border border-dashed border-border rounded-full">
            Beta
          </span>
          <div className="flex-1" />
          <UserMenu user={user} />
        </header>

        {/* Usage warning banner */}
        {billingWarning && (
          <div
            className={`mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 ${billingWarning.atLimit ? "" : ""}`}
          >
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                billingWarning.atLimit
                  ? "bg-destructive-muted text-destructive"
                  : "bg-warning-muted text-warning"
              }`}
            >
              <IconAlertTriangle className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                {billingWarning.atLimit
                  ? `You've reached the ${billingWarning.max}-item limit. Upgrade to Pro to keep saving.`
                  : `${billingWarning.current} of ${billingWarning.max} items used. Upgrade to Pro for unlimited saves.`}
              </span>
            </div>
          </div>
        )}

        {/* Control Bar */}
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between gap-2 pt-2 pb-4 sm:pb-6">
            {/* Left side: Add button + All items */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Add Button */}
              {!isTrashView && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-md border-[var(--border-primary)] bg-[var(--bg-control-btn)] text-[var(--fg)] hover:bg-[var(--bg-field-hover)] focus-visible:ring-[var(--border-primary)] shadow-[0_0_0_1px_rgba(31,34,37,0.09)_inset,0_2px_8px_-2px_rgba(0,0,0,0.04),0_2px_4px_-2px_rgba(0,0,0,0.04)] transition-none"
                        aria-label="Add menu"
                      />
                    }
                  >
                    <IconPlus className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem
                      onClick={() => onOpenAddMode()}
                      disabled={isAddingItem}
                    >
                      <IconPlus className="h-4 w-4 text-fg-on-overlay-muted" />
                      Link
                    </DropdownMenuItem>
                    {(onUploadImages || onUploadDocuments) && (
                      <DropdownMenuItem onClick={() => uploadInputRef.current?.click()}>
                        <IconUpload className="h-4 w-4 text-fg-on-overlay-muted" />
                        Upload
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onOpenAddMode()} disabled={isAddingItem}>
                      <IconPalette className="h-4 w-4 text-fg-on-overlay-muted" />
                      Color
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreateNote?.()} disabled={!onCreateNote}>
                      <IconNotes className="h-4 w-4 text-fg-on-overlay-muted" />
                      Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreateSpace?.()} disabled={!onCreateSpace}>
                      <IconFolder className="h-4 w-4 text-fg-on-overlay-muted" />
                      Space
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Vertical Divider */}
              {!isTrashView && (
                <div className="h-8 w-px bg-border-muted" />
              )}

              <div className="flex items-center gap-2 min-w-0">
                <ViewSwitcher
                  selectedCategoryId={selectedCategoryId}
                  onViewChange={onViewChange}
                  spaces={spaces}
                  onCreateSpace={onCreateSpace}
                  onEditSpace={onEditSpace}
                  onDeleteSpace={onDeleteSpace}
                  title={isTrashView ? "Trash" : selectedSpace?.name || "All"}
                  isTrashView={isTrashView}
                />
                {isTrashView && (
                  <Badge variant="secondary" className="bg-bg-muted px-2 py-0.75 text-fg-subtle rounded-full">
                    Auto-deletes in 60 days
                  </Badge>
                )}
              </div>
            </div>

            {/* Right side: Search + Options */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle pointer-events-none z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  className="h-9 w-32 sm:w-48 md:w-[250px] py-0 pl-[26px] pr-[22px] rounded-lg outline-none placeholder:text-fg-subtle text-fg bg-bg-input focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 text-sm font-[470] tracking-[-0.1px]"
                  aria-label="Search"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 hidden sm:flex items-center">
                  <Kbd className="h-5 px-1.5 text-[10px] text-fg-subtle flex items-center justify-center">
                    /
                  </Kbd>
                </div>
              </div>

              {/* Options Menu */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="secondary"
                      size="icon"
                      className="hidden sm:flex h-9 w-9 rounded-md bg-bg-input hover:bg-bg-hover transition-none"
                      aria-label="Options"
                    />
                  }
                >
                  <IconDots className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {/* View Mode Toggle */}
                  <div className="flex items-center justify-between px-2 py-2">
                    <p className="text-xs font-medium text-fg-on-overlay-muted">
                      View
                    </p>
                    <div className="flex items-center rounded-lg bg-btn-overlay-hover/50 p-0.5 gap-0.5">
                      <button
                        onClick={() => onViewModeChange("list")}
                        className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors ${viewMode === "list" ? "bg-btn-overlay-hover text-fg-on-overlay" : "text-fg-on-overlay-muted hover:text-fg-on-overlay"}`}
                        aria-label="List view"
                      >
                        <IconLayoutList className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onViewModeChange("grid")}
                        className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors ${viewMode === "grid" ? "bg-btn-overlay-hover text-fg-on-overlay" : "text-fg-on-overlay-muted hover:text-fg-on-overlay"}`}
                        aria-label="Grid view"
                      >
                        <IconLayoutGrid className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {/* Sort */}
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-fg-on-overlay-muted">
                      Sort by
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5 px-0.75 pb-0.75">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("date");
                      }}
                      className={`cursor-pointer rounded-xl ${sortBy === "date" ? "bg-btn-overlay-hover" : ""}`}
                    >
                      {sortBy === "date" ? (
                        <IconCircleCheckFilled className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-5 h-5" />
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
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("title");
                      }}
                      className={`cursor-pointer rounded-xl ${sortBy === "title" ? "bg-btn-overlay-hover" : ""}`}
                    >
                      {sortBy === "title" ? (
                        <IconCircleCheckFilled className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-5 h-5" />
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

        {/* Column Headers + Divider */}
        <div className={`mx-auto w-full ${viewMode === "list" ? "max-w-4xl" : ""} px-4 sm:px-6 md:px-8`}>
          {viewMode === "list" ? (
            <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_150px] gap-1 items-center text-xs font-medium text-fg-subtle select-none pt-2 pb-3">
              <div>Title</div>
              <div className="text-right">Created</div>
            </div>
          ) : (
            <div className="pt-2 pb-3" />
          )}
          {/* Divider line */}
          <div className="border-b border-border-muted" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`mx-auto w-full ${viewMode === "list" ? "max-w-4xl" : ""} px-4 sm:px-6 md:px-8 pt-6 pb-32 sm:pb-28`}>
        <div className={viewMode === "list" ? "-mx-2" : ""}>
          {children}
        </div>
      </div>

      {/* Bottom fade mask */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 z-10 pointer-events-none bg-gradient-to-t from-bg to-transparent"
      />

      {/* Dock - Selection Toolbar Only */}
      <Dock
        selectedCount={selectedCount}
        onClearSelection={onClearSelection}
        onBatchDelete={onBatchDelete}
        onBatchRestore={onBatchRestore}
        onBatchPermanentDelete={onBatchPermanentDelete}
        onBatchPin={onBatchPin}
        onBatchUnpin={onBatchUnpin}
        onBatchCopyLinks={onBatchCopyLinks}
        onBatchMoveToSpace={onBatchMoveToSpace}
        selectedLinks={selectedLinks}
        isTrashView={isTrashView}
        spaces={spaces}
      />

      {/* Global drag-drop overlay */}
      {isDraggingFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-accent bg-bg-surface px-12 py-10">
            <IconUpload className="h-10 w-10 text-accent" />
            <p className="text-base font-medium text-fg">Drop a PDF or image to upload</p>
          </div>
        </div>
      )}

      <GlobalCommandMenu
        open={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
        isTrashView={isTrashView}
        viewMode={viewMode}
        spaces={spaces}
        selectedCategoryId={selectedCategoryId}
        onOpenAddMode={onOpenAddMode}
        onViewChange={onViewChange}
        onViewModeChange={onViewModeChange}
        onSortChange={handleSortChange}
        onToggleHelp={toggleHelp}
        onUploadClick={onUploadImages || onUploadDocuments ? () => uploadInputRef.current?.click() : undefined}
        onCreateNote={onCreateNote}
        onCreateSpace={onCreateSpace}
        initialSearchQuery={searchQuery}
        onCommitSearch={(value) => {
          onSearchChange(value);
          updateUrl(value);
        }}
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleUploadInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <Dialog open={isSubscriptionCelebrationOpen} onOpenChange={setIsSubscriptionCelebrationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCircleCheckFilled className="h-5 w-5 text-success" />
              You are subscribed
            </DialogTitle>
            <DialogDescription>
              Your upgrade is active now. Paid features are unlocked and ready to use.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsSubscriptionCelebrationOpen(false)}>Let&apos;s go</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
