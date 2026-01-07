"use client";

import type { Link } from "@/features/links/types";
import {
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuSubPopup,
  MenuCheckboxItem,
} from "@/components/ui/menu";
import { Kbd } from "@/components/ui/kbd";
import { IconCopy, IconEdit, IconPin, IconPinnedOff, IconTrash, IconRestore, IconExternalLink, IconPencil, IconCapsuleHorizontalFilled } from "@tabler/icons-react";
import type { Space } from "@/types";

interface LinkContextMenuProps {
  link: Link;
  selectedCount?: number;
  selectedIds?: Set<string>;
  links?: Link[];
  isTrashView?: boolean;
  onCopy?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onRename?: (link: Link) => void;
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
  spaces?: Space[];
  linkSpaces?: string[]; // Array of space IDs this link belongs to
  onAddToSpace?: (linkId: string, spaceId: string) => Promise<void>;
  onRemoveFromSpace?: (linkId: string, spaceId: string) => Promise<void>;
}

export function LinkContextMenu({
  link,
  selectedCount = 0,
  selectedIds,
  links = [],
  isTrashView = false,
  onCopy,
  onEdit,
  onRename,
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
  spaces = [],
  linkSpaces = [],
  onAddToSpace,
  onRemoveFromSpace,
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
              <IconRestore className="h-4 w-4 text-[var(--icon-secondary)]" />
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
            <IconPin className="h-4 w-4 text-[var(--icon-secondary)]" />
            Pin {selectedCount} items
          </MenuItem>
        )}
        {(allPinned || hasMixed) && onBatchUnpin && (
          <MenuItem onClick={onBatchUnpin}>
            <IconPinnedOff className="h-4 w-4 text-[var(--icon-secondary)]" />
            Unpin {selectedCount} items
          </MenuItem>
        )}
        {((allUnpinned || hasMixed) && onBatchPin || (allPinned || hasMixed) && onBatchUnpin) && <MenuSeparator />}
        <MenuItem
          className="text-[var(--accent-red-primary)] focus:text-[var(--accent-red-primary)]"
          onClick={onBatchDelete}
        >
          <IconTrash className="mr-2 h-4 w-4" />
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
          <IconExternalLink className="h-4 w-4 text-[var(--icon-secondary)]" />
          Open
        </MenuItem>
        <MenuItem onClick={() => onCopy?.(link.url)} className="justify-between">
          <div className="flex items-center gap-4">
            <IconCopy className="h-4 w-4 text-[var(--icon-secondary)]" />
            Copy URL
          </div>
          <Kbd>⌘C</Kbd>
        </MenuItem>
        {onRestore && (
          <>
            <MenuSeparator />
            <MenuItem onClick={() => onRestore(link.id)}>
              <IconRestore className="h-4 w-4 text-[var(--icon-secondary)]" />
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
              <IconTrash className="mr-2 h-4 w-4" />
              Delete permanently
            </MenuItem>
          </>
        )}
      </>
    );
  }

  const isColor = link.content_type === 'color';
  const copyValue = isColor ? (link.color_value || link.title) : link.url;

  // Normal view single item actions
  return (
    <>
      <MenuItem onClick={() => onCopy?.(copyValue)} className="justify-between">
        <div className="flex items-center gap-4">
          <IconCopy className="h-4 w-4 text-[var(--icon-secondary)]" />
          {isColor ? 'Copy Color' : 'Copy URL'}
        </div>
        <Kbd>⌘C</Kbd>
      </MenuItem>
      <MenuItem onClick={() => onRename?.(link)}>
        <IconPencil className="h-4 w-4 text-[var(--icon-secondary)]" />
        Rename
      </MenuItem>
      {link.is_pinned ? (
        onUnpin && (
          <MenuItem onClick={() => onUnpin(link.id)}>
            <IconPinnedOff className="h-4 w-4 text-[var(--icon-secondary)]" />
            Unpin
          </MenuItem>
        )
      ) : (
        onPin && (
          <MenuItem onClick={() => onPin(link.id)}>
            <IconPin className="h-4 w-4 text-[var(--icon-secondary)]" />
            Pin
          </MenuItem>
        )
      )}

      {spaces.length > 0 && (onAddToSpace || onRemoveFromSpace) && (
        <>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>
              <IconCapsuleHorizontalFilled className="h-4 w-4 text-[var(--icon-secondary)]" />
              Move to Space
            </MenuSubTrigger>
            <MenuSubPopup>
              {spaces.map((space) => {
                const isInSpace = linkSpaces.includes(space.id);
                return (
                  <MenuCheckboxItem
                    key={space.id}
                    checked={isInSpace}
                    onCheckedChange={async (checked) => {
                      if (checked && onAddToSpace) {
                        await onAddToSpace(link.id, space.id);
                      } else if (!checked && onRemoveFromSpace) {
                        await onRemoveFromSpace(link.id, space.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <IconCapsuleHorizontalFilled 
                        className="h-3 w-3" 
                        style={{ color: space.color }}
                      />
                      <span>{space.name}</span>
                    </div>
                  </MenuCheckboxItem>
                );
              })}
            </MenuSubPopup>
          </MenuSub>
        </>
      )}

      <MenuSeparator />
      <MenuItem
        className="text-[var(--accent-red-primary)] focus:text-[var(--accent-red-primary)] justify-between"
        onClick={() => onDelete?.(link.id)}
      >
        <div className="flex items-center gap-4">
          <IconTrash className="h-4 w-4" />
          Delete
        </div>
        <Kbd>⌘⌫</Kbd>
      </MenuItem>
    </>
  );
}

