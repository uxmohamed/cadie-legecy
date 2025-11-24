"use client";

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
import { Icon } from "@iconify/react";

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
        <button
          onClick={onClearSelection}
          className="flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <Icon icon="tabler:x" width={16} height={16} />
        </button>
      </div>

      <button
        onClick={onBatchArchive}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors select-none"
      >
        <Icon icon="tabler:archive" width={16} height={16} />
        Archive
      </button>

      <button
        onClick={onBatchDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors select-none"
      >
        <Icon icon="tabler:trash" width={16} height={16} />
        Delete
      </button>

      <Menu>
        <MenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors select-none">
          <Icon icon="tabler:dots-horizontal" width={16} height={16} />
          Actions
        </MenuTrigger>
        <MenuPopup align="center" side="top">
          <MenuItem onClick={onBatchPin}>
            <Icon icon="tabler:pin" width={16} height={16} />
            Pin Selected
          </MenuItem>
          <MenuItem onClick={onBatchUnpin}>
            <Icon icon="tabler:pin-off" width={16} height={16} />
            Unpin Selected
          </MenuItem>
        </MenuPopup>
      </Menu>
    </div>
  );
}
