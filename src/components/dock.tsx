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
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from "@/components/ui/popover";
import {
  IconPlus,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconCheck,
} from "@tabler/icons-react";

interface DockProps {
  onAddClick: () => void;
  onSearchClick?: () => void;
  sortBy?: "date" | "title";
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: "date" | "title", order: "asc" | "desc") => void;
}

export function Dock({
  onAddClick,
  onSearchClick,
  sortBy = "date",
  sortOrder = "desc",
  onSortChange,
}: DockProps) {
  const [sortPopoverOpen, setSortPopoverOpen] = React.useState(false);

  const handleSortChange = (newSortBy: "date" | "title") => {
    if (sortBy === newSortBy) {
      // Toggle order if same field
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      onSortChange?.(newSortBy, newOrder);
    } else {
      // New field, default to descending
      onSortChange?.(newSortBy, "desc");
    }
    setSortPopoverOpen(false);
  };

  const getSortIcon = () => {
    const iconStyle = { width: '18px', height: '18px' };
    if (sortBy === "date") {
      return sortOrder === "desc" ? (
        <IconSortDescending style={iconStyle} />
      ) : (
        <IconSortAscending style={iconStyle} />
      );
    }
    return sortOrder === "desc" ? (
      <IconSortDescending style={iconStyle} />
    ) : (
      <IconSortAscending style={iconStyle} />
    );
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider delayDuration={300}>
        <nav
          className="overlay-blur flex items-center py-1.5 px-1.5 rounded-full border-[var(--overlay-border)]"
          style={{ gap: '4px' }}
          aria-label="Dock actions"
        >
          {/* Add Button - Light grey, always highlighted */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onAddClick}
                aria-label="Add link"
                variant="ghost"
                style={{ padding: '0', width: '50px', height: '50px' }}
                className="rounded-full bg-[var(--overlay-hover)] hover:bg-[var(--overlay-hover)] text-[var(--overlay-text-primary)] [&_svg]:!w-[18px] [&_svg]:!h-[18px] shrink-0"
              >
                <IconPlus style={{ width: '18px', height: '18px' }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={12}>
              <div className="flex items-center gap-2">
                <span>Add</span>
                <Kbd>C</Kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSearchClick}
                aria-label="Search"
                variant="ghost"
                style={{ padding: '0', width: '50px', height: '50px' }}
                className="rounded-full bg-transparent hover:bg-[var(--overlay-hover)] text-[var(--overlay-text-primary)] [&_svg]:!w-[18px] [&_svg]:!h-[18px] shrink-0"
              >
                <IconSearch style={{ width: '18px', height: '18px' }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={12}>
              <div className="flex items-center gap-2">
                <span>Search</span>
                <Kbd>/</Kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Sort Button with Popover */}
          <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    aria-label="Sort"
                    variant="ghost"
                    style={{ padding: '0', width: '50px', height: '50px' }}
                    className="rounded-full bg-transparent hover:bg-[var(--overlay-hover)] text-[var(--overlay-text-primary)] [&_svg]:!w-[18px] [&_svg]:!h-[18px] shrink-0"
                  >
                    {getSortIcon()}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                <span>Sort</span>
              </TooltipContent>
            </Tooltip>
            <PopoverPopup side="top" align="center" sideOffset={12} className="w-48 p-2">
              <div className="px-2 py-1.5 text-xs text-[var(--overlay-text-secondary)] font-[470]">
                Sort by
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={() => handleSortChange("title")}
                  className={`relative flex w-full cursor-default select-none items-center justify-between rounded-lg px-2 py-1.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] ${
                    sortBy === "title"
                      ? "bg-[var(--overlay-hover)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "title" && (
                      <IconCheck className="h-4 w-4" />
                    )}
                    <span>Name</span>
                  </div>
                  {sortBy === "title" && (
                    sortOrder === "asc" ? (
                      <IconSortAscending className="h-4 w-4" />
                    ) : (
                      <IconSortDescending className="h-4 w-4" />
                    )
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("date")}
                  className={`relative flex w-full cursor-default select-none items-center justify-between rounded-lg px-2 py-1.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] ${
                    sortBy === "date"
                      ? "bg-[var(--overlay-hover)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "date" && (
                      <IconCheck className="h-4 w-4" />
                    )}
                    <span>Date Added</span>
                  </div>
                  {sortBy === "date" && (
                    sortOrder === "asc" ? (
                      <IconSortAscending className="h-4 w-4" />
                    ) : (
                      <IconSortDescending className="h-4 w-4" />
                    )
                  )}
                </button>
              </div>
            </PopoverPopup>
          </Popover>
        </nav>
      </TooltipProvider>
    </div>
  );
}
