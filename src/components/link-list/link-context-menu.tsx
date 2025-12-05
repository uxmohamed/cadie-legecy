"use client";

import type { Link } from "@/features/links/types";
import {
  MenuItem,
  MenuSeparator,
  MenuShortcut,
} from "@/components/ui/menu";
import { IconCopy, IconEdit, IconPin, IconPinnedOff, IconTrash } from "@tabler/icons-react";

interface LinkContextMenuProps {
  link: Link;
  selectedCount?: number;
  selectedIds?: Set<string>;
  links?: Link[];
  onCopyUrl?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  onBatchDelete?: () => void;
}

export function LinkContextMenu({
  link,
  selectedCount = 0,
  selectedIds,
  links = [],
  onCopyUrl,
  onEdit,
  onPin,
  onUnpin,
  onDelete,
  onBatchPin,
  onBatchUnpin,
  onBatchDelete,
}: LinkContextMenuProps) {
  const isMultiSelect = selectedCount > 1;
  const isLinkSelected = selectedIds?.has(link.id);

  // If multiple items are selected and this link is one of them, show batch operations
  if (isMultiSelect && isLinkSelected) {
    // Determine pin state of selected items
    const selectedLinks = links.filter(l => selectedIds?.has(l.id));
    const allPinned = selectedLinks.every(l => l.is_pinned);
    const allUnpinned = selectedLinks.every(l => !l.is_pinned);
    const hasMixed = !allPinned && !allUnpinned;

    return (
      <>
        {(allUnpinned || hasMixed) && onBatchPin && (
          <MenuItem onClick={onBatchPin}>
            <IconPin className="h-4 w-4" />
            Pin {selectedCount} items
          </MenuItem>
        )}
        {(allPinned || hasMixed) && onBatchUnpin && (
          <MenuItem onClick={onBatchUnpin}>
            <IconPinnedOff className="h-4 w-4" />
            Unpin {selectedCount} items
          </MenuItem>
        )}
        {((allUnpinned || hasMixed) && onBatchPin || (allPinned || hasMixed) && onBatchUnpin) && <MenuSeparator />}
        <MenuItem
          className="text-[var(--accent-red-primary)] focus:text-[var(--accent-red-primary)]"
          onClick={onBatchDelete}
        >
          <IconTrash className="h-4 w-4" />
          Delete {selectedCount} items
        </MenuItem>
      </>
    );
  }

  // Single item context menu
  return (
    <>
      <MenuItem onClick={() => onCopyUrl?.(link.url)}>
        <IconCopy className="h-4 w-4" />
        Copy URL
        <MenuShortcut>⌘C</MenuShortcut>
      </MenuItem>
      <MenuItem onClick={() => onEdit?.(link)}>
        <IconEdit className="h-4 w-4" />
        Edit
        <MenuShortcut>⌘E</MenuShortcut>
      </MenuItem>
      {link.is_pinned ? (
        onUnpin && (
          <MenuItem onClick={() => onUnpin(link.id)}>
            <IconPinnedOff className="h-4 w-4" />
            Unpin
          </MenuItem>
        )
      ) : (
        onPin && (
          <MenuItem onClick={() => onPin(link.id)}>
            <IconPin className="h-4 w-4" />
            Pin
          </MenuItem>
        )
      )}

      <MenuSeparator />
      <MenuItem
        className="text-[var(--accent-red-primary)] focus:text-[var(--accent-red-primary)]"
        onClick={() => onDelete?.(link.id)}
      >
        <IconTrash className="h-4 w-4" />
        Delete
        <MenuShortcut>⌘⇧⌫</MenuShortcut>
      </MenuItem>
    </>
  );
}
