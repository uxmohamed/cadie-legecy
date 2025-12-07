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
  IconCapsuleHorizontalFilled,
  IconTrashFilled,
} from "@tabler/icons-react";
import { ChevronUpDown } from "@/components/icons/chevron-up-down";

interface DockProps {
  selectedCategoryId?: string | null;
  onViewChange?: (view: string | null) => void;
  allItemsCount?: number;
}

export function Dock({
  selectedCategoryId = null,
  onViewChange,
  allItemsCount,
}: DockProps) {
  const [viewPopoverOpen, setViewPopoverOpen] = React.useState(false);

  const handleViewChange = (view: string | null) => {
    onViewChange?.(view);
    setViewPopoverOpen(false);
  };

  const isAllItemsSelected = selectedCategoryId === null;
  const isTrashSelected = selectedCategoryId === "trash";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider delayDuration={300}>
        <nav
          className="overlay-blur flex items-center gap-1 py-1.5 px-1.5 rounded-full border-[var(--overlay-border)]"
          aria-label="Dock actions"
        >
          {/* View Switcher Chip with Dropdown */}
          {onViewChange && (
            <Popover open={viewPopoverOpen} onOpenChange={setViewPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label="Switch view"
                      variant="ghost"
                      className="rounded-full bg-[var(--overlay-hover)] hover:bg-white/25 text-[var(--overlay-text-primary)] shrink-0 transition-colors px-4 h-[50px] gap-2"
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
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white">
                        <IconCheck className="h-3 w-3 text-black" />
                      </div>
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
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white">
                        <IconCheck className="h-3 w-3 text-black" />
                      </div>
                    ) : (
                      <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)]">
                        ⇧ T
                      </Kbd>
                    )}
                  </button>
                </div>
              </PopoverPopup>
            </Popover>
          )}
        </nav>
      </TooltipProvider>
    </div>
  );
}
