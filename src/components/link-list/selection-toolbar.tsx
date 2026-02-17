"use client";

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { IconX, IconTrash, IconDots, IconPin, IconPinnedOff, IconRestore, IconCopy, IconCapsuleHorizontalFilled } from "@tabler/icons-react";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  onBatchCopyLinks?: () => Promise<void>;
  onBatchMoveToSpace?: (spaceId: string) => Promise<void>;
  selectedLinks?: Link[];
  isTrashView?: boolean;
  spaces?: Space[];
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  onBatchCopyLinks,
  onBatchMoveToSpace,
  selectedLinks = [],
  isTrashView = false,
  spaces = [],
}: SelectionToolbarProps) {
  if (selectedCount < 2) return null;

  // Determine which pin/unpin actions to show
  const allPinned = selectedLinks.length > 0 && selectedLinks.every(link => link.is_pinned);
  const allUnpinned = selectedLinks.length > 0 && selectedLinks.every(link => !link.is_pinned);
  const hasMixed = selectedLinks.length > 0 && !allPinned && !allUnpinned;

  // Show pin if all are unpinned or mixed
  const showPin = (allUnpinned || hasMixed) && onBatchPin;
  // Show unpin if all are pinned or mixed
  const showUnpin = (allPinned || hasMixed) && onBatchUnpin;
  const showMoveToSpace = spaces.length > 0 && onBatchMoveToSpace;

  if (isTrashView) {
    return (
      <div className="flex items-center gap-1 py-1.5 px-1.5">
        <div className="flex items-center gap-2 px-2 border-r border-[var(--overlay-border)] pr-3 mr-1">
          <span className="text-sm font-[470] text-[var(--overlay-text-primary)] select-none whitespace-nowrap leading-none">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="h-auto w-auto p-0 text-[var(--overlay-text-secondary)] hover:text-[var(--overlay-text-primary)] hover:bg-transparent"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        {onBatchRestore && (
          <Button
            variant="ghost"
            onClick={onBatchRestore}
            className="rounded-full h-auto gap-1.5 px-3 py-1.5 text-sm font-[470] text-[var(--overlay-text-primary)] hover:bg-white/25 transition-colors"
          >
            <IconRestore className="h-4 w-4" />
            Restore
          </Button>
        )}

        {onBatchPermanentDelete && (
          <Button
            variant="ghost"
            onClick={onBatchPermanentDelete}
            className="rounded-full h-auto gap-1.5 px-3 py-1.5 text-sm font-[470] text-[var(--destructive)] hover:bg-white/25 transition-colors"
          >
            <IconTrash className="h-4 w-4" />
            Delete permanently
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 py-1.5 px-1.5">
      <div className="flex items-center gap-2 px-2 border-r border-[var(--overlay-border)] pr-3 mr-1">
        <span className="text-sm font-[470] text-[var(--overlay-text-primary)] select-none whitespace-nowrap leading-none">
          {selectedCount} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="h-auto w-auto p-0 text-[var(--overlay-text-secondary)] hover:text-[var(--overlay-text-primary)] hover:bg-transparent"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onBatchDelete}
        className="rounded-full h-auto gap-1.5 px-3 py-1.5 text-sm font-[470] text-[var(--destructive)] hover:bg-white/25 transition-colors"
      >
        <IconTrash className="h-4 w-4" />
        Delete
      </Button>

      <Menu modal={false}>
        <MenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-[470] text-[var(--overlay-text-secondary)] hover:bg-white/25 rounded-full transition-colors select-none h-auto">
          <IconDots className="h-4 w-4" />
          Actions
        </MenuTrigger>
        <MenuPopup align="center" side="top" sideOffset={16}>
          {onBatchCopyLinks && (
            <MenuItem onClick={onBatchCopyLinks}>
              <IconCopy className="h-4 w-4" />
              Copy links
            </MenuItem>
          )}
          {showMoveToSpace && (
            <MenuSub>
              <MenuSubTrigger>
                <IconCapsuleHorizontalFilled className="h-4 w-4" />
                Move to Space
              </MenuSubTrigger>
              <MenuSubPopup>
                {spaces.map((space) => (
                  <MenuItem
                    key={space.id}
                    onClick={() => onBatchMoveToSpace?.(space.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconCapsuleHorizontalFilled
                        className="h-3 w-3 shrink-0"
                        style={{ color: space.color }}
                      />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                        {space.name}
                      </span>
                    </div>
                  </MenuItem>
                ))}
              </MenuSubPopup>
            </MenuSub>
          )}
          {(onBatchCopyLinks || showMoveToSpace) && (showPin || showUnpin) && <MenuSeparator />}
          {showPin && (
            <MenuItem onClick={onBatchPin}>
              <IconPin className="h-4 w-4" />
              Pin Selected
            </MenuItem>
          )}
          {showUnpin && (
            <MenuItem onClick={onBatchUnpin}>
              <IconPinnedOff className="h-4 w-4" />
              Unpin Selected
            </MenuItem>
          )}
        </MenuPopup>
      </Menu>
    </div>
  );
}
