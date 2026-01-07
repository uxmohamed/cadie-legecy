"use client";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/ui/popover";
import {
  IconCircleCheckFilled,
  IconCapsuleHorizontalFilled,
  IconTrashFilled,
} from "@tabler/icons-react";
import { ChevronUpDown } from "@/components/icons/chevron-up-down";
import type { Space } from "@/types";
import { IconPlus } from "@tabler/icons-react";

interface ViewSwitcherProps {
  selectedCategoryId?: string | null;
  onViewChange?: (view: string | null) => void;
  spaces?: Space[];
  onCreateSpace?: () => void;
  title: string;
  isTrashView?: boolean;
}

export function ViewSwitcher({
  selectedCategoryId = null,
  onViewChange,
  spaces = [],
  onCreateSpace,
  title,
  isTrashView = false,
}: ViewSwitcherProps) {
  const [viewPopoverOpen, setViewPopoverOpen] = React.useState(false);

  const handleViewChange = (view: string | null) => {
    onViewChange?.(view);
    setViewPopoverOpen(false);
  };

  const isAllItemsSelected = selectedCategoryId === null;
  const isTrashSelected = selectedCategoryId === "trash";
  const selectedSpace = spaces.find(s => s.id === selectedCategoryId);

  if (!onViewChange) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Popover open={viewPopoverOpen} onOpenChange={setViewPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                aria-label="Switch view"
                className="flex items-center gap-2 h-auto p-0 bg-transparent hover:bg-transparent text-[var(--text-primary)] transition-colors cursor-pointer min-w-0"
              >
                {isTrashSelected ? (
                  <IconTrashFilled className="h-4 w-4 text-[var(--accent-red-primary)] shrink-0" />
                ) : (
                  <IconCapsuleHorizontalFilled 
                    className="h-4 w-4 shrink-0" 
                    style={{ color: selectedSpace?.color || "var(--text-secondary)" }}
                  />
                )}
                <span className="not-italic text-lg sm:text-[22px] font-[570] leading-tight sm:leading-[32px] tracking-[-0.16px] text-[var(--text-primary)] hover:text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                  {title}
                </span>
                <ChevronUpDown className="w-3.5 h-3.5 shrink-0" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <span>Switch view</span>
          </TooltipContent>
        </Tooltip>
        <PopoverPopup
          side="bottom"
          align="start"
          sideOffset={12}
          className="w-56 p-2 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.1)] [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.2)]"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleViewChange(null)}
              className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] gap-2 min-w-0 ${
                isAllItemsSelected ? "bg-[var(--bg-selected)]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <IconCapsuleHorizontalFilled className="h-4 w-4 text-[var(--overlay-text-secondary)] shrink-0" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">All items</span>
              </div>
              {isAllItemsSelected ? (
                <IconCircleCheckFilled className="h-5 w-5 text-white shrink-0" />
              ) : (
                <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)] shrink-0">
                  1
                </Kbd>
              )}
            </button>
            
            {/* Spaces list */}
            {spaces.length > 0 && (
              <>
                {spaces.map((space, index) => {
                  const isSelected = selectedCategoryId === space.id;
                  // Generate shortcut: 2-9 for first 8 spaces, then 1A-9A, 1B-9B, etc.
                  let shortcutKey: string;
                  if (index < 8) {
                    // First 8 spaces: shortcuts 2-9
                    shortcutKey = String(index + 2);
                  } else {
                    // Spaces beyond 8: 1A-9A, then 1B-9B, etc.
                    const group = Math.floor((index - 8) / 9);
                    const number = ((index - 8) % 9) + 1;
                    const letter = String.fromCharCode(65 + group); // 65 = 'A', 66 = 'B', 67 = 'C', etc.
                    shortcutKey = `${number}${letter}`;
                  }
                  
                  return (
                    <button
                      key={space.id}
                      onClick={() => handleViewChange(space.id)}
                      className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] gap-2 min-w-0 ${
                        isSelected ? "bg-[var(--bg-selected)]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <IconCapsuleHorizontalFilled 
                          className="h-4 w-4 shrink-0" 
                          style={{ color: space.color }}
                        />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{space.name}</span>
                      </div>
                      {isSelected ? (
                        <IconCircleCheckFilled className="h-5 w-5 text-white shrink-0" />
                      ) : (
                        <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)] shrink-0">
                          {shortcutKey}
                        </Kbd>
                      )}
                    </button>
                  );
                })}
              </>
            )}
            
            <div className="h-px bg-[var(--overlay-border)] my-1" />
            
            <button
              onClick={() => handleViewChange("trash")}
              className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] gap-2 min-w-0 ${
                isTrashSelected ? "bg-[var(--bg-selected)]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <IconTrashFilled className="h-4 w-4 text-[var(--accent-red-primary)] shrink-0" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">Trash</span>
              </div>
              {isTrashSelected ? (
                <IconCircleCheckFilled className="h-5 w-5 text-white shrink-0" />
              ) : (
                <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)] shrink-0">
                  ⇧T
                </Kbd>
              )}
            </button>
            
            {/* New Space button */}
            {onCreateSpace && (
              <>
                <div className="h-px bg-[var(--overlay-border)] my-1" />
                <button
                  onClick={() => {
                    onCreateSpace();
                    setViewPopoverOpen(false);
                  }}
                  className="relative flex w-full cursor-pointer select-none items-center justify-center rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <div className="flex items-center gap-2.5">
                    <IconPlus className="h-4 w-4" />
                    <span>New Space</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </PopoverPopup>
      </Popover>
    </TooltipProvider>
  );
}
