"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";

interface UseKeyboardNavigationOptions {
  displayLinks: Link[];
  linkRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>;
  focusedIndex: number | null;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedIds: Set<string>;
  clearSelection: () => void;
  selectAll: () => void;
  onBatchArchive: () => void;
  onBatchDelete: () => void;
  onEdit?: (link: Link) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

import { useShortcuts } from "@/components/shortcut-context";

// ... existing interface ...

export function useKeyboardNavigation({
  displayLinks,
  linkRefs,
  focusedIndex,
  setFocusedIndex,
  selectedIds,
  clearSelection,
  selectAll,
  onBatchArchive,
  onBatchDelete,
  onEdit,
  onDelete,
  onArchive,
}: UseKeyboardNavigationOptions) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  // Register shortcuts for documentation purposes
  React.useEffect(() => {
    const shortcuts = [
      { key: "j", description: "Move selection up", category: "Navigation", action: () => { } },
      { key: "k", description: "Move selection down", category: "Navigation", action: () => { } },
      { key: "Enter", description: "Open selected link", category: "Navigation", action: () => { } },
      { key: "e", description: "Edit selected link", category: "Actions", action: () => { } },
      { key: "d", description: "Delete selected link", category: "Actions", action: () => { } },
      { key: "Backspace", description: "Archive/Delete selection", category: "Actions", action: () => { } },
      { key: "Cmd+a", description: "Select all", category: "Actions", action: () => { } },
    ] as const;

    shortcuts.forEach((s) => registerShortcut(s as any));
    return () => shortcuts.forEach((s) => unregisterShortcut(s.key));
  }, [registerShortcut, unregisterShortcut]);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isInputFocused) return;

      // Navigation
      if (e.key === "ArrowDown" || e.key === "k") {
        e.preventDefault();
        if (focusedIndex === null) {
          setFocusedIndex(0);
          linkRefs.current[0]?.focus();
        } else {
          const nextIndex =
            focusedIndex < displayLinks.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(nextIndex);
          linkRefs.current[nextIndex]?.focus();
        }
      } else if (e.key === "ArrowUp" || e.key === "j") {
        e.preventDefault();
        if (focusedIndex === null) {
          setFocusedIndex(displayLinks.length - 1);
          linkRefs.current[displayLinks.length - 1]?.focus();
        } else {
          const prevIndex =
            focusedIndex > 0 ? focusedIndex - 1 : displayLinks.length - 1;
          setFocusedIndex(prevIndex);
          linkRefs.current[prevIndex]?.focus();
        }
      }

      // Actions
      if (e.key === "Enter" && focusedIndex !== null) {
        // The link itself handles Enter by default if focused, but if we want to trigger the sheet:
        // We might need a callback for "onSelect" or similar if it's not just a link click.
        // For now, let default behavior happen (opening the link href).
        // If we want to open the details sheet, we need to simulate the click or call a prop.
        // The current implementation of LinkListItem handles onClick to open the sheet.
        // So Enter on a focused link should trigger onClick natively?
        // Yes, for <a> tags or buttons.
      }

      if (e.key === "Escape") {
        clearSelection();
        setFocusedIndex(null);
        (document.activeElement as HTMLElement)?.blur();
      }

      if (e.key === "Home") {
        e.preventDefault();
        setFocusedIndex(0);
        linkRefs.current[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        const lastIndex = displayLinks.length - 1;
        setFocusedIndex(lastIndex);
        linkRefs.current[lastIndex]?.focus();
      }

      // Batch / Selection actions
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      if (e.metaKey && selectedIds.size > 0) {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (e.shiftKey) onBatchDelete();
          else onBatchArchive();
        }
      }

      // Single item actions (vim style)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && focusedIndex !== null) {
        const focusedLink = displayLinks[focusedIndex];
        if (!focusedLink) return;

        if (e.key === "e") {
          e.preventDefault();
          onEdit?.(focusedLink);
        }

        if (e.key === "d") {
          e.preventDefault();
          onDelete?.(focusedLink.id);
        }

        if (e.key === "q") {
          e.preventDefault();
          onArchive?.(focusedLink.id);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    focusedIndex,
    displayLinks, // Added displayLinks to dependency
    selectedIds,
    clearSelection,
    selectAll,
    onBatchArchive,
    onBatchDelete,
    setFocusedIndex,
    linkRefs,
    onEdit,
    onDelete,
  ]);
}
