"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/ui/popover";
import {
  IconCheck,
  IconCircleCheckFilled,
  IconCapsuleHorizontalFilled,
  IconTrashFilled,
} from "@tabler/icons-react";
import { ChevronUpDown } from "@/components/icons/chevron-up-down";
import { SelectionToolbar } from "@/components/link-list/selection-toolbar";
import type { Link } from "@/features/links/types";

interface DockProps {
  selectedCategoryId?: string | null;
  onViewChange?: (view: string | null) => void;
  allItemsCount?: number;
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
  selectedCategoryId = null,
  onViewChange,
  allItemsCount,
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
  const [viewPopoverOpen, setViewPopoverOpen] = React.useState(false);
  const [navWidth, setNavWidth] = React.useState<number | null>(null);
  const selectionRef = React.useRef<HTMLDivElement>(null);
  const viewSwitcherRef = React.useRef<HTMLDivElement>(null);
  const [animationDirection, setAnimationDirection] = React.useState<'up' | 'down'>('up');
  const prevHasSelectionRef = React.useRef(false);
  const selectionWidthRef = React.useRef<number | null>(null);
  const viewSwitcherWidthRef = React.useRef<number | null>(null);

  const handleViewChange = (view: string | null) => {
    onViewChange?.(view);
    setViewPopoverOpen(false);
  };

  const isAllItemsSelected = selectedCategoryId === null;
  const isTrashSelected = selectedCategoryId === "trash";
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
    if (selectionRef.current) {
      const width = measureContentWidth(selectionRef);
      if (width && width > 0 && width < window.innerWidth) {
        selectionWidthRef.current = width;
      }
    }

    // Measure view switcher width whenever it exists
    if (viewSwitcherRef.current) {
      const width = measureContentWidth(viewSwitcherRef);
      if (width && width > 0 && width < window.innerWidth) {
        viewSwitcherWidthRef.current = width;
      }
    }

    // Set the appropriate width based on selection state
    if (hasSelection && selectionWidthRef.current) {
      setNavWidth(selectionWidthRef.current);
    } else if (!hasSelection && viewSwitcherWidthRef.current) {
      setNavWidth(viewSwitcherWidthRef.current);
    } else if (!hasSelection) {
      setNavWidth(null);
    }
  }, [hasSelection, selectedCount, isTrashSelected]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider delayDuration={300}>
        <nav
          className="overlay-blur inline-flex items-center gap-1 rounded-full border-[var(--overlay-border)] relative min-h-[50px]"
          aria-label={hasSelection ? "Selection actions" : "Dock actions"}
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
            data-state={hasSelection ? 'visible' : 'hidden'}
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

          {/* View Switcher Chip with Dropdown */}
          {onViewChange && (
            <div
              ref={viewSwitcherRef}
              className="dock-content dock-view-switcher"
              data-state={!hasSelection ? 'visible' : 'hidden'}
            >
              <Popover open={viewPopoverOpen} onOpenChange={setViewPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        aria-label="Switch view"
                        variant="ghost"
                        className="rounded-full bg-transparent hover:!bg-transparent text-[var(--overlay-text-primary)] shrink-0 transition-colors px-4 h-[50px] gap-2"
                      >
                        {isTrashSelected ? (
                          <IconTrashFilled className="h-[18px] w-[18px] text-[var(--accent-red-primary)]" />
                        ) : (
                          <IconCapsuleHorizontalFilled className="h-[18px] w-[18px] text-[var(--overlay-text-secondary)]" />
                        )}
                        <span className="text-sm font-[470]">
                          {isTrashSelected ? "Trash" : "All items"}
                        </span>
                        <ChevronUpDown className="w-[15px] h-[15px]" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={12}>
                    <span>Switch view</span>
                  </TooltipContent>
                </Tooltip>
                <PopoverPopup
                  side="top"
                  align="center"
                  sideOffset={12}
                  className="w-56 p-2"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleViewChange(null)}
                      className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] ${
                        isAllItemsSelected ? "bg-[rgba(255,255,255,0.1)]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconCapsuleHorizontalFilled className="h-4 w-4 text-[var(--overlay-text-secondary)]" />
                        <span>All items</span>
                      </div>
                      {isAllItemsSelected ? (
                        <IconCircleCheckFilled className="h-5 w-5 text-white" />
                      ) : (
                        <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)]">
                          1
                        </Kbd>
                      )}
                    </button>
                    <button
                      onClick={() => handleViewChange("trash")}
                      className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] ${
                        isTrashSelected ? "bg-[rgba(255,255,255,0.1)]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconTrashFilled className="h-4 w-4 text-[var(--accent-red-primary)]" />
                        <span>Trash</span>
                      </div>
                      {isTrashSelected ? (
                        <IconCircleCheckFilled className="h-5 w-5 text-white" />
                      ) : (
                        <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)]">
                          ⇧T
                        </Kbd>
                      )}
                    </button>
                  </div>
                </PopoverPopup>
              </Popover>
            </div>
          )}
        </nav>
      </TooltipProvider>
    </div>
  );
}
