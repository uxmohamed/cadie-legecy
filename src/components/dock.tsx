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
import { Input } from "@/components/ui/input";
import {
  IconPlus,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconCheck,
  IconChevronDown,
  IconArrowsSort,
  IconCapsuleHorizontalFilled,
  IconTrashFilled,
  IconCaretUpDown,
  IconCaretUpDownFilled,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import {
  detectMultipleContentTypes,
  type DetectedContent,
} from "@/lib/content-detector";

interface DockProps {
  onAddClick?: () => void;
  onAddSubmit?: (items: DetectedContent[]) => void;
  onSearchClick?: () => void;
  sortBy?: "date" | "title";
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: "date" | "title", order: "asc" | "desc") => void;
  isLoading?: boolean;
  selectedCategoryId?: string | null;
  onViewChange?: (view: string | null) => void;
  allItemsCount?: number;
}

export function Dock({
  onAddClick,
  onAddSubmit,
  onSearchClick,
  sortBy = "date",
  sortOrder = "desc",
  onSortChange,
  isLoading = false,
  selectedCategoryId = null,
  onViewChange,
  allItemsCount,
}: DockProps) {
  const [sortPopoverOpen, setSortPopoverOpen] = React.useState(false);
  const [addPopoverOpen, setAddPopoverOpen] = React.useState(false);
  const [viewPopoverOpen, setViewPopoverOpen] = React.useState(false);
  const [addInputValue, setAddInputValue] = React.useState("");
  const addInputRef = React.useRef<HTMLInputElement>(null);

  const handleSortChange = (newSortBy: "date" | "title") => {
    if (sortBy === newSortBy) {
      // Toggle order if same field
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      onSortChange?.(newSortBy, newOrder);
    } else {
      // New field, default to descending
      onSortChange?.(newSortBy, "desc");
    }
  };

  const handleAddClick = () => {
    if (onAddSubmit) {
      setAddPopoverOpen(true);
    } else {
      onAddClick?.();
    }
  };

  // Auto-focus input when popover opens
  React.useEffect(() => {
    if (addPopoverOpen && addInputRef.current) {
      // Small delay to ensure popover is fully rendered
      const timer = setTimeout(() => {
        addInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [addPopoverOpen]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInputValue.trim() || isLoading || !onAddSubmit) return;

    const detectedItems = detectMultipleContentTypes(addInputValue);
    if (detectedItems.length > 0) {
      onAddSubmit(detectedItems);
      setAddInputValue("");
      setAddPopoverOpen(false);
    }
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddInputValue(e.target.value);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setAddInputValue("");
      setAddPopoverOpen(false);
    }
  };

  const getSortIcon = () => {
    if (sortBy === "date") {
      return sortOrder === "desc" ? (
        <IconSortDescending className="w-[18px] h-[18px]" />
      ) : (
        <IconSortAscending className="w-[18px] h-[18px]" />
      );
    }
    return sortOrder === "desc" ? (
      <IconSortDescending className="w-[18px] h-[18px]" />
    ) : (
      <IconSortAscending className="w-[18px] h-[18px]" />
    );
  };

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
          {/* Add Button with Popover */}
          <Popover
            open={addPopoverOpen && !!onAddSubmit}
            onOpenChange={setAddPopoverOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    onClick={handleAddClick}
                    aria-label="Add link"
                    variant="ghost"
                    className="p-0 w-[50px] h-[50px] rounded-full bg-[var(--overlay-hover)] hover:bg-white/25 text-[var(--overlay-text-primary)] [&_svg]:!w-[18px] [&_svg]:!h-[18px] shrink-0 transition-colors"
                  >
                    <IconPlus className="w-[18px] h-[18px]" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                <div className="flex items-center gap-2">
                  <span>Add</span>
                  <Kbd>C</Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
            {onAddSubmit && (
              <PopoverPopup
                side="top"
                align="center"
                sideOffset={12}
                className="w-[420px] p-3"
              >
                <form onSubmit={handleAddSubmit} className="space-y-3">
                  <div className="px-2 text-sm font-[470] text-[var(--overlay-text-primary)]">
                    Add item
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={addInputRef}
                      type="text"
                      value={addInputValue}
                      onChange={handleAddInputChange}
                      onKeyDown={handleAddKeyDown}
                      placeholder="Add a link or color..."
                      disabled={isLoading}
                      unstyled
                      className="flex-1 rounded-lg bg-[var(--overlay-hover)] px-3 py-2 text-sm placeholder:text-[var(--overlay-text-primary)]/70 text-[var(--overlay-text-primary)] outline-none"
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      disabled={!addInputValue.trim() || isLoading}
                      variant="default"
                      className="shrink-0 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </Button>
                  </div>
                </form>
              </PopoverPopup>
            )}
          </Popover>

          {/* Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSearchClick}
                aria-label="Search"
                variant="ghost"
                className="p-0 w-[50px] h-[50px] rounded-full bg-transparent hover:bg-[var(--overlay-hover)] text-[var(--overlay-text-primary)] [&_svg]:!w-[18px] [&_svg]:!h-[18px] shrink-0"
              >
                <IconSearch className="w-[18px] h-[18px]" />
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
                    className="p-0 w-[50px] h-[50px] rounded-full bg-transparent hover:bg-[var(--overlay-hover)] text-[var(--overlay-text-primary)] [&_svg]:!w-[18px] [&_svg]:!h-[18px] shrink-0"
                  >
                    {getSortIcon()}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                <span>Sort</span>
              </TooltipContent>
            </Tooltip>
            <PopoverPopup
              side="top"
              align="center"
              sideOffset={12}
              className="w-64 p-2"
            >
              <div className="px-3 py-1.5 text-sm text-[var(--overlay-text-primary)] font-[570]">
                Sort by
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={() => handleSortChange("title")}
                  className={`relative flex w-full cursor-default select-none items-center justify-between rounded-2xl px-3 py-2.5 text-[15px] font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.1)] ${
                    sortBy === "title" ? "bg-[rgba(255,255,255,0.1)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "title" && (
                      <div className="p-1 rounded-full bg-white">
                        <IconCheck className="h-3 w-3 text-black" />
                      </div>
                    )}
                    <span className={sortBy !== "title" ? "ml-7" : ""}>
                      Name
                    </span>
                  </div>
                  {sortBy === "title" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="h-4 w-4" />
                    ) : (
                      <IconArrowDown className="h-4 w-4" />
                    ))}
                </button>
                <button
                  onClick={() => handleSortChange("date")}
                  className={`relative flex w-full cursor-default select-none items-center justify-between rounded-2xl px-3 py-2.5 text-[15px] font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.1)] ${
                    sortBy === "date" ? "bg-[rgba(255,255,255,0.1)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sortBy === "date" && (
                      <div className="p-1 rounded-full bg-white">
                        <IconCheck className="h-3 w-3 text-black" />
                      </div>
                    )}
                    <span className={sortBy !== "date" ? "ml-7" : ""}>
                      Date Added
                    </span>
                  </div>
                  {sortBy === "date" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="h-4 w-4" />
                    ) : (
                      <IconArrowDown className="h-4 w-4" />
                    ))}
                </button>
              </div>
            </PopoverPopup>
          </Popover>

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
                      <IconCaretUpDownFilled
                        className="w-4 h-4"
                      />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={12}>
                  <span>Switch view</span>
                </TooltipContent>
              </Tooltip>
              <PopoverPopup
                side="top"
                align="end"
                sideOffset={12}
                className="w-48 p-2"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleViewChange(null)}
                    className={`relative flex w-full cursor-default select-none items-center justify-between rounded-lg px-2 py-1.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] ${
                      isAllItemsSelected ? "bg-[var(--overlay-hover)]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconCapsuleHorizontalFilled className="h-3 w-3 text-[var(--overlay-text-secondary)]" />
                      <span>All items</span>
                    </div>
                    {isAllItemsSelected ? (
                      <IconCheck className="h-4 w-4" />
                    ) : allItemsCount !== undefined && allItemsCount > 0 ? (
                      <span className="text-xs font-[470] text-[var(--overlay-text-secondary)] bg-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded-full">
                        {allItemsCount}
                      </span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => handleViewChange("trash")}
                    className={`relative flex w-full cursor-default select-none items-center justify-between rounded-lg px-2 py-1.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] ${
                      isTrashSelected ? "bg-[var(--overlay-hover)]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconTrashFilled className="h-3 w-3 text-[var(--accent-red-primary)]" />
                      <span>Trash</span>
                    </div>
                    {isTrashSelected ? (
                      <IconCheck className="h-4 w-4" />
                    ) : (
                      <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)]">
                        ⇧T
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
