"use client";

import type { Link } from "@/types";
import * as React from "react";

interface UseSelectionOptions {
  displayLinks: Link[];
}

export function useSelection({ displayLinks }: UseSelectionOptions) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartIndex, setDragStartIndex] = React.useState<number | null>(
    null,
  );
  const [dragCurrentIndex, setDragCurrentIndex] = React.useState<number | null>(
    null,
  );
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<
    number | null
  >(null);

  const mouseDownPos = React.useRef<{ x: number; y: number } | null>(null);
  const wasDraggingRef = React.useRef(false);
  const shouldOpenRef = React.useRef(false);

  // Clean up selected IDs when links change
  React.useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of next) {
        if (!displayLinks.find((l) => l.id === id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [displayLinks]);

  // Global mouse up/move handler
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDownPos.current) return;

      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5 && !isDragging) {
        setIsDragging(true);
        wasDraggingRef.current = true;
        shouldOpenRef.current = false;
      }
    };

    const handleMouseUp = () => {
      mouseDownPos.current = null;
      if (isDragging) {
        setIsDragging(false);
        setDragStartIndex(null);
        setDragCurrentIndex(null);
        setTimeout(() => {
          wasDraggingRef.current = false;
        }, 0);
      } else {
        wasDraggingRef.current = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        selectedIds.size > 0 &&
        !target.closest(".group") &&
        !target.closest(".fixed.bottom-8") &&
        !target.closest('[role="menu"]')
      ) {
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isDragging, selectedIds.size]);

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleItemMouseDown = (index: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.preventDefault();
    }

    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setDragStartIndex(index);
    setDragCurrentIndex(index);

    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      shouldOpenRef.current = true;
    } else {
      shouldOpenRef.current = false;
    }

    if (e.shiftKey || e.metaKey) {
      if (e.shiftKey) {
        if (lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          const newSet = new Set(selectedIds);
          if (!e.metaKey) newSet.clear();
          for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
          }
          setSelectedIds(newSet);
        } else {
          const newSet = new Set(selectedIds);
          newSet.add(displayLinks[index].id);
          setSelectedIds(newSet);
          setLastSelectedIndex(index);
        }
      } else if (e.metaKey) {
        const id = displayLinks[index].id;
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else {
          newSet.add(id);
          setLastSelectedIndex(index);
        }
        setSelectedIds(newSet);
      }
    }
  };

  const handleItemMouseEnter = (index: number) => {
    if (isDragging && dragStartIndex !== null) {
      setDragCurrentIndex(index);

      const start = Math.min(dragStartIndex, index);
      const end = Math.max(dragStartIndex, index);

      const newSet = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSet.add(displayLinks[i].id);
      }
      setSelectedIds(newSet);
    }
  };

  const handleRowClick = (
    e: React.MouseEvent<HTMLDivElement>,
    link: Link,
    index: number,
    onOpen: () => void,
  ) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return;
    }

    if (e.metaKey || e.shiftKey || wasDraggingRef.current) {
      e.preventDefault();

      if (wasDraggingRef.current) return;

      if (e.metaKey) {
        const newSet = new Set(selectedIds);
        if (newSet.has(link.id)) {
          newSet.delete(link.id);
        } else {
          newSet.add(link.id);
          setLastSelectedIndex(index);
        }
        setSelectedIds(newSet);
      } else if (e.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSet = new Set(selectedIds);
        if (!e.metaKey) {
          newSet.clear();
        }

        for (let i = start; i <= end; i++) {
          newSet.add(displayLinks[i].id);
        }
        setSelectedIds(newSet);
      }
      return;
    }

    if (shouldOpenRef.current) {
      onOpen();
    }

    shouldOpenRef.current = false;
  };

  const selectAll = () => {
    const newSet = new Set(displayLinks.map((l) => l.id));
    setSelectedIds(newSet);
  };

  return {
    selectedIds,
    setSelectedIds,
    isDragging,
    lastSelectedIndex,
    setLastSelectedIndex,
    clearSelection,
    selectAll,
    handleItemMouseDown,
    handleItemMouseEnter,
    handleRowClick,
  };
}
