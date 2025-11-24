"use client";

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { X, Archive, Trash2, MoreHorizontal, Pin, PinOff } from "lucide-react";

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchArchive: () => void;
  onBatchDelete: () => void;
  onBatchPin: () => void;
  onBatchUnpin: () => void;
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onBatchArchive,
  onBatchDelete,
  onBatchPin,
  onBatchUnpin,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white border border-neutral-200 shadow-xl rounded-lg p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 px-2 border-r border-neutral-200 pr-3 mr-1">
        <span className="text-sm font-medium text-neutral-900 select-none">
          {selectedCount} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-auto w-auto p-0 text-neutral-400 hover:text-neutral-900 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onBatchArchive}
        className="h-auto gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        <Archive className="h-4 w-4" />
        Archive
      </Button>

      <Button
        variant="ghost"
        onClick={onBatchDelete}
        className="h-auto gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>

      <Menu>
        <MenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors select-none">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </MenuTrigger>
        <MenuPopup align="center" side="top">
          <MenuItem onClick={onBatchPin}>
            <Pin className="h-4 w-4" />
            Pin Selected
          </MenuItem>
          <MenuItem onClick={onBatchUnpin}>
            <PinOff className="h-4 w-4" />
            Unpin Selected
          </MenuItem>
        </MenuPopup>
      </Menu>
    </div>
  );
}
