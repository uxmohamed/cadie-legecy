"use client";
import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SelectionToolbar } from "@/components/link-list/selection-toolbar";
import type { Link } from "@/features/links/types";

interface DockProps {
  selectedCount?: number;
  onClearSelection?: () => void;
  onBatchDelete?: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  selectedLinks?: Link[];
  isTrashView?: boolean;
}

export function Dock({
  selectedCount = 0,
  onClearSelection,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  selectedLinks = [],
  isTrashView = false,
}: DockProps) {
  const [navWidth, setNavWidth] = React.useState<number | null>(null);
  const selectionRef = React.useRef<HTMLDivElement>(null);
  const [animationDirection, setAnimationDirection] = React.useState<'up' | 'down'>('up');
  const prevHasSelectionRef = React.useRef(false);
  const selectionWidthRef = React.useRef<number | null>(null);

  const hasSelection = selectedCount >= 2;

  // Track animation direction
  React.useEffect(() => {
    if (hasSelection !== prevHasSelectionRef.current) {
      setAnimationDirection(hasSelection ? 'up' : 'down');
      prevHasSelectionRef.current = hasSelection;
    }
  }, [hasSelection]);

  // Measure widths when content changes
  React.useLayoutEffect(() => {
    const measureContentWidth = (ref: React.RefObject<HTMLDivElement | null>): number | null => {
      if (!ref.current) return null;
      const wrapper = ref.current;
      const firstChild = wrapper.firstElementChild as HTMLElement;
      if (!firstChild) return null;
      
      // Temporarily change wrapper to static positioning to measure natural width
      const originalPosition = wrapper.style.position;
      const originalVisibility = wrapper.style.visibility;
      const originalPointerEvents = wrapper.style.pointerEvents;
      
      wrapper.style.position = 'static';
      wrapper.style.visibility = 'hidden';
      wrapper.style.pointerEvents = 'none';
      
      // Force layout recalculation
      void wrapper.offsetWidth;
      
      const width = firstChild.offsetWidth || firstChild.scrollWidth;
      
      // Restore original styles
      wrapper.style.position = originalPosition;
      wrapper.style.visibility = originalVisibility;
      wrapper.style.pointerEvents = originalPointerEvents;
      
      return width;
    };

    // Measure selection toolbar width whenever it exists
    if (selectionRef.current && hasSelection) {
      const width = measureContentWidth(selectionRef);
      if (width && width > 0 && width < window.innerWidth) {
        selectionWidthRef.current = width;
        setNavWidth(width);
      }
    } else if (!hasSelection) {
      setNavWidth(null);
    }
  }, [hasSelection, selectedCount]);

  // Only render when there's a selection
  if (!hasSelection) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider delayDuration={300}>
        <nav
          className="overlay-blur inline-flex items-center gap-1 rounded-full border-[var(--overlay-border)] relative min-h-[50px]"
          aria-label="Selection actions"
          style={{
            width: navWidth !== null && navWidth > 0 ? `${navWidth}px` : 'auto',
            transition: navWidth !== null ? 'width 300ms ease-out' : undefined,
            maxWidth: '100%',
          }}
          data-has-selection={hasSelection}
          data-direction={animationDirection}
        >
          {/* Selection Toolbar */}
          <div
            ref={selectionRef}
            className="dock-content dock-selection"
            data-state="visible"
          >
            <SelectionToolbar
              selectedCount={selectedCount}
              onClearSelection={onClearSelection || (() => {})}
              onBatchDelete={onBatchDelete || (() => {})}
              onBatchRestore={onBatchRestore}
              onBatchPermanentDelete={onBatchPermanentDelete}
              onBatchPin={onBatchPin}
              onBatchUnpin={onBatchUnpin}
              selectedLinks={selectedLinks}
              isTrashView={isTrashView}
            />
          </div>
        </nav>
      </TooltipProvider>
    </div>
  );
}
