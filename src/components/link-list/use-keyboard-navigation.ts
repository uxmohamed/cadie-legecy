"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";

interface UseKeyboardNavigationOptions {
  displayLinks: Link[];
  linkRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>;
  focusedIndex: number | null;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearSelection: () => void;
  selectAll: () => void;

  onBatchDelete: () => void;
  onBatchPermanentDelete?: () => void;
  onEdit?: (link: Link) => void;
  onDelete?: (id: string) => void;
  isTrashView?: boolean;
  lastSelectedIndex: number | null;
  setLastSelectedIndex: (index: number | null) => void;
}

import { useShortcuts } from "@/components/shortcut-context";

// ... existing interface ...

export function useKeyboardNavigation({
  displayLinks,
  linkRefs,
  focusedIndex,
  setFocusedIndex,
  selectedIds,
  setSelectedIds,
  clearSelection,
  selectAll,

  onBatchDelete,
  onBatchPermanentDelete,
  onEdit,
  onDelete,
  isTrashView,
  lastSelectedIndex,
  setLastSelectedIndex,
}: UseKeyboardNavigationOptions) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  // Register shortcuts for documentation purposes
  React.useEffect(() => {
    const shortcuts = [
      { key: "j", description: "Move selection up", category: "Navigation", action: () => { } },
      { key: "k", description: "Move selection down", category: "Navigation", action: () => { } },
      { key: "Enter", description: "Open selected link", category: "Navigation", action: () => { } },
      { key: "e", description: "Edit selected link", category: "Actions", action: () => { } },
      { key: "d", description: "Move to Trash", category: "Actions", action: () => { } },
      { key: "Backspace", description: "Delete selection", category: "Actions", action: () => { } },
      { key: "Cmd+a", description: "Select all", category: "Actions", action: () => { } },
    ] as const;

    shortcuts.forEach((s) => registerShortcut(s));
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
        let nextIndex = 0;

        if (focusedIndex === null) {
          nextIndex = 0;
        } else {
          nextIndex = focusedIndex < displayLinks.length - 1 ? focusedIndex + 1 : 0;
        }

        setFocusedIndex(nextIndex);
        linkRefs.current[nextIndex]?.focus();

        // Handle selection
        if (e.shiftKey) {
          // Range selection
          const anchor = lastSelectedIndex ?? (focusedIndex ?? 0);
          if (lastSelectedIndex === null) {
            setLastSelectedIndex(anchor);
          }

          const start = Math.min(anchor, nextIndex);
          const end = Math.max(anchor, nextIndex);

          const newSet = new Set<string>();
          for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
          }
          setSelectedIds(newSet);

        } else if (!e.ctrlKey && !e.metaKey) {
          // No modifiers: Move focus AND select ONLY the new item
          const newSet = new Set<string>();
          newSet.add(displayLinks[nextIndex].id);
          setSelectedIds(newSet);
          setLastSelectedIndex(nextIndex);
        }

      } else if (e.key === "ArrowUp" || e.key === "j") {
        e.preventDefault();
        let nextIndex = 0;

        if (focusedIndex === null) {
          nextIndex = displayLinks.length - 1;
        } else {
          nextIndex = focusedIndex > 0 ? focusedIndex - 1 : displayLinks.length - 1;
        }

        setFocusedIndex(nextIndex);
        linkRefs.current[nextIndex]?.focus();

        // Handle selection (same logic as Down)
        if (e.shiftKey) {
          const anchor = lastSelectedIndex ?? (focusedIndex ?? displayLinks.length - 1);
          if (lastSelectedIndex === null) {
            setLastSelectedIndex(anchor);
          }

          const start = Math.min(anchor, nextIndex);
          const end = Math.max(anchor, nextIndex);

          const newSet = new Set<string>();
          for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
          }
          setSelectedIds(newSet);
        } else if (!e.ctrlKey && !e.metaKey) {
          // Select single
          const newSet = new Set<string>();
          newSet.add(displayLinks[nextIndex].id);
          setSelectedIds(newSet);
          setLastSelectedIndex(nextIndex);
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
          // In trash view, Cmd+Backspace should permanently delete
          // In normal view, it should move to trash
          if (isTrashView && onBatchPermanentDelete) {
            onBatchPermanentDelete();
          } else {
            onBatchDelete();
          }
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
      }

      // Space key selection
      if (e.code === "Space" && focusedIndex !== null && !isInputFocused) {
        e.preventDefault();
        const focusedLink = displayLinks[focusedIndex];

        if (e.shiftKey) {
          // Range selection (same as Arrow keys)
          const anchor = lastSelectedIndex ?? focusedIndex;
          if (lastSelectedIndex === null) {
            setLastSelectedIndex(anchor);
          }

          const start = Math.min(anchor, focusedIndex);
          const end = Math.max(anchor, focusedIndex);

          const newSet = new Set(selectedIds);
          if (!e.metaKey && !e.ctrlKey) newSet.clear();

          for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
          }
          setSelectedIds(newSet);
        } else if (e.metaKey || e.ctrlKey) {
          // Toggle selection
          const newSet = new Set(selectedIds);
          if (newSet.has(focusedLink.id)) {
            newSet.delete(focusedLink.id);
          } else {
            newSet.add(focusedLink.id);
            setLastSelectedIndex(focusedIndex);
          }
          setSelectedIds(newSet);
        } else {
          // Select single
          const newSet = new Set<string>();
          newSet.add(focusedLink.id);
          setSelectedIds(newSet);
          setLastSelectedIndex(focusedIndex);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    focusedIndex,
    displayLinks,
    selectedIds,
    setSelectedIds,
    clearSelection,
    selectAll,
    onBatchDelete,
    onBatchPermanentDelete,
    setFocusedIndex,
    linkRefs,
    onEdit,
    onDelete,
    isTrashView,
    lastSelectedIndex,
    setLastSelectedIndex,
  ]);
}
