"use client";

import type { Link } from "@/features/links/types";
import {
  MenuItem,
  MenuSeparator,
  MenuShortcut,
} from "@/components/ui/menu";
import { IconCopy, IconEdit, IconPin, IconPinnedOff, IconTrash, IconRestore, IconExternalLink } from "@tabler/icons-react";

interface LinkContextMenuProps {
  link: Link;
  selectedCount?: number;
  selectedIds?: Set<string>;
  links?: Link[];
  isTrashView?: boolean;
  onCopyUrl?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  onBatchDelete?: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
}

export function LinkContextMenu({
  link,
  selectedCount = 0,
  selectedIds,
  links = [],
  isTrashView = false,
  onCopyUrl,
  onEdit,
  onPin,
  onUnpin,
  onDelete,
  onRestore,
  onPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
}: LinkContextMenuProps) {
  const isMultiSelect = selectedCount > 1;
  const isLinkSelected = selectedIds?.has(link.id);

  // If multiple items are selected and this link is one of them, show batch operations
  if (isMultiSelect && isLinkSelected) {
    if (isTrashView) {
      // Trash view batch actions
      return (
        <>
          {onBatchRestore && (
            <MenuItem onClick={onBatchRestore}>
              <IconRestore className="h-4 w-4" />
              Restore {selectedCount} items
            </MenuItem>
          )}
          {onBatchPermanentDelete && (
            <>
              {onBatchRestore && <MenuSeparator />}
              <MenuItem
                className="text-[var(--accent-red-primary)] focus:text-[var(--accent-red-primary)]"
                onClick={onBatchPermanentDelete}
              >
                <IconTrash className="h-4 w-4" />
                Delete {selectedCount} items permanently
              </MenuItem>
            </>
          )}
        </>
      );
    }

    // Normal view batch actions
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
  if (isTrashView) {
    // Trash view single item actions
    return (
      <>
        <MenuItem onClick={() => window.open(link.url, '_blank')}>
          <IconExternalLink className="h-4 w-4" />
          Open
        </MenuItem>
        <MenuItem onClick={() => onCopyUrl?.(link.url)}>
          <IconCopy className="h-4 w-4" />
          Copy URL
          <MenuShortcut>⌘C</MenuShortcut>
        </MenuItem>
        {onRestore && (
          <>
            <MenuSeparator />
            <MenuItem onClick={() => onRestore(link.id)}>
              <IconRestore className="h-4 w-4" />
              Restore
            </MenuItem>
          </>
        )}
        {onPermanentDelete && (
          <>
            <MenuSeparator />
            <MenuItem
              className="text-[var(--accent-red-primary)] focus:text-[var(--accent-red-primary)]"
              onClick={() => onPermanentDelete(link.id)}
            >
              <IconTrash className="h-4 w-4" />
              Delete permanently
            </MenuItem>
          </>
        )}
      </>
    );
  }

  // Normal view single item actions
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

