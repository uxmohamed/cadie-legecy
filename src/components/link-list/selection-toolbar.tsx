"use client";

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { IconX, IconTrash, IconDots, IconPin, IconPinnedOff } from "@tabler/icons-react";

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;

  onBatchDelete: () => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,

  onBatchDelete,
  onBatchPin,
  onBatchUnpin,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[var(--bg-l0-solid)] border border-[var(--border-primary)] shadow-xl rounded-lg p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 px-2 border-r border-[var(--border-primary)] pr-3 mr-1">
        <span className="text-sm font-medium text-[var(--text-primary)] select-none">
          {selectedCount} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="h-auto w-auto p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-transparent"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>



      <Button
        variant="ghost"
        onClick={onBatchDelete}
        className="h-auto gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--accent-red-primary)] hover:bg-[var(--accent-red-subtle)] hover:text-[var(--accent-red-strong)]"
      >
        <IconTrash className="h-4 w-4" />
        Delete
      </Button>

      <Menu>
        <MenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)] rounded-md transition-colors select-none">
          <IconDots className="h-4 w-4" />
          Actions
        </MenuTrigger>
        <MenuPopup align="center" side="top">
          {onBatchPin && (
            <MenuItem onClick={onBatchPin}>
              <IconPin className="h-4 w-4" />
              Pin Selected
            </MenuItem>
          )}
          {onBatchUnpin && (
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
