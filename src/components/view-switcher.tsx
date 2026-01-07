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
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  IconCircleCheckFilled,
  IconCapsuleHorizontalFilled,
  IconTrashFilled,
  IconDots,
  IconPencil,
} from "@tabler/icons-react";
import { ChevronUpDown } from "@/components/icons/chevron-up-down";
import type { Space } from "@/types";
import { IconPlus } from "@tabler/icons-react";

interface ViewSwitcherProps {
  selectedCategoryId?: string | null;
  onViewChange?: (view: string | null) => void;
  spaces?: Space[];
  onCreateSpace?: () => void;
  onEditSpace?: (space: Space) => void;
  onDeleteSpace?: (spaceId: string) => void;
  title: string;
  isTrashView?: boolean;
}

export function ViewSwitcher({
  selectedCategoryId = null,
  onViewChange,
  spaces = [],
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  title,
  isTrashView = false,
}: ViewSwitcherProps) {
  const [viewPopoverOpen, setViewPopoverOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [spaceToDelete, setSpaceToDelete] = React.useState<Space | null>(null);

  const handleViewChange = (view: string | null) => {
    onViewChange?.(view);
    setViewPopoverOpen(false);
  };

  const handleDeleteClick = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpaceToDelete(space);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (spaceToDelete && onDeleteSpace) {
      onDeleteSpace(spaceToDelete.id);
      setViewPopoverOpen(false);
      setDeleteDialogOpen(false);
      setSpaceToDelete(null);
    }
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
          className="w-56 p-2 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.1)] [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.2)] border-[var(--overlay-border)] shadow-md"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleViewChange(null)}
              className={`group relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] gap-2 min-w-0 ${
                isAllItemsSelected ? "bg-[var(--bg-selected)]" : ""
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <IconCapsuleHorizontalFilled className="h-4 w-4 text-[var(--overlay-text-secondary)] shrink-0" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">All</span>
              </div>
              {isAllItemsSelected ? (
                <IconCircleCheckFilled className="h-5 w-5 text-white shrink-0 group-hover:opacity-0" />
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
                    <div
                      key={space.id}
                      className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] transition-colors gap-2 min-w-0 ${
                        isSelected ? "bg-[var(--bg-selected)]" : "hover:bg-[rgba(255,255,255,0.06)]"
                      }`}
                    >
                      <button
                        onClick={() => handleViewChange(space.id)}
                        className="flex w-full cursor-pointer select-none items-center justify-between gap-2 min-w-0 outline-none relative"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <IconCapsuleHorizontalFilled 
                            className="h-4 w-4 shrink-0" 
                            style={{ color: space.color }}
                          />
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 text-[var(--overlay-text-primary)]">{space.name}</span>
                        </div>
                        {isSelected ? (
                          <>
                            <IconCircleCheckFilled className="h-5 w-5 text-white shrink-0 group-hover:opacity-0 transition-opacity" />
                            {(onEditSpace || onDeleteSpace) && (
                              <Menu modal={false}>
                                <MenuTrigger
                                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-[rgba(255,255,255,0.1)] outline-none p-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  <IconDots className="h-4 w-4 text-[var(--overlay-text-secondary)]" />
                                </MenuTrigger>
                                <MenuPopup 
                                  align="start" 
                                  side="right" 
                                  sideOffset={22}
                                  className="rounded-[14px] border-[var(--overlay-border)] shadow-md outline-none overflow-hidden"
                                >
                                  {onEditSpace && (
                                    <MenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSpace(space);
                                        setViewPopoverOpen(false);
                                      }}
                                    >
                                      <IconPencil className="h-4 w-4" />
                                      Edit
                                    </MenuItem>
                                  )}
                                  {onDeleteSpace && (
                                    <MenuItem
                                      onClick={(e) => handleDeleteClick(space, e)}
                                      className="text-[var(--accent-red-primary)]"
                                    >
                                      <IconTrashFilled className="h-4 w-4" />
                                      Remove
                                    </MenuItem>
                                  )}
                                </MenuPopup>
                              </Menu>
                            )}
                          </>
                        ) : (
                          <>
                            <Kbd className="h-5 px-1.5 text-[10px] bg-[rgba(255,255,255,0.1)] text-[var(--overlay-text-secondary)] shrink-0 group-hover:opacity-0 transition-opacity">
                              {shortcutKey}
                            </Kbd>
                            {(onEditSpace || onDeleteSpace) && (
                              <Menu modal={false}>
                                <MenuTrigger
                                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-[rgba(255,255,255,0.1)] outline-none p-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  <IconDots className="h-4 w-4 text-[var(--overlay-text-secondary)]" />
                                </MenuTrigger>
                                <MenuPopup 
                                  align="start" 
                                  side="right" 
                                  sideOffset={22}
                                  className="rounded-[14px] border-[var(--overlay-border)] shadow-md outline-none overflow-hidden"
                                >
                                  {onEditSpace && (
                                    <MenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSpace(space);
                                        setViewPopoverOpen(false);
                                      }}
                                    >
                                      <IconPencil className="h-4 w-4" />
                                      Edit
                                    </MenuItem>
                                  )}
                                  {onDeleteSpace && (
                                    <MenuItem
                                      onClick={(e) => handleDeleteClick(space, e)}
                                      className="text-[var(--accent-red-primary)]"
                                    >
                                      <IconTrashFilled className="h-4 w-4" />
                                      Remove
                                    </MenuItem>
                                  )}
                                </MenuPopup>
                              </Menu>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
            
            <div className="h-px bg-[var(--overlay-border)] my-1" />
            
            <button
              onClick={() => handleViewChange("trash")}
              className={`group relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] gap-2 min-w-0 ${
                isTrashSelected ? "bg-[var(--bg-selected)]" : ""
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <IconTrashFilled className="h-4 w-4 text-[var(--accent-red-primary)] shrink-0" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">Trash</span>
              </div>
              {isTrashSelected ? (
                <IconCircleCheckFilled className="h-5 w-5 text-white shrink-0 group-hover:opacity-0" />
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
                  className="relative flex w-full cursor-pointer select-none items-center justify-start rounded-xl px-3 py-2.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] gap-2 min-w-0"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <IconPlus className="h-4 w-4 shrink-0" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">New Space</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </PopoverPopup>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete space?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{spaceToDelete?.name}"? This will remove all links from this space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </TooltipProvider>
  );
}
