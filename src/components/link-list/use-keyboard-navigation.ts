"use client";

import * as React from "react";
import type { Link } from "@/types";

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
}

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
}: UseKeyboardNavigationOptions) {
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        return;
      }

      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !isInputFocused) {
        e.preventDefault();

        if (focusedIndex === null) {
          setFocusedIndex(0);
          linkRefs.current[0]?.focus();
        } else {
          if (e.key === "ArrowDown") {
            const nextIndex =
              focusedIndex < displayLinks.length - 1 ? focusedIndex + 1 : 0;
            setFocusedIndex(nextIndex);
            linkRefs.current[nextIndex]?.focus();
          } else if (e.key === "ArrowUp") {
            const prevIndex =
              focusedIndex > 0 ? focusedIndex - 1 : displayLinks.length - 1;
            setFocusedIndex(prevIndex);
            linkRefs.current[prevIndex]?.focus();
          }
        }
      }

      if (e.key === "Escape") {
        clearSelection();
      }

      if (e.key === "Home" && !isInputFocused) {
        e.preventDefault();
        setFocusedIndex(0);
        linkRefs.current[0]?.focus();
      } else if (e.key === "End" && !isInputFocused) {
        e.preventDefault();
        const lastIndex = displayLinks.length - 1;
        setFocusedIndex(lastIndex);
        linkRefs.current[lastIndex]?.focus();
      }

      if (e.metaKey && selectedIds.size > 0) {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (e.shiftKey) onBatchDelete();
          else onBatchArchive();
        }

        if (e.key === "a") {
          e.preventDefault();
          selectAll();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    focusedIndex,
    displayLinks.length,
    selectedIds,
    clearSelection,
    selectAll,
    onBatchArchive,
    onBatchDelete,
    setFocusedIndex,
    linkRefs,
  ]);
}
