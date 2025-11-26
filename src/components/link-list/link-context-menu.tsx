"use client";

import type { Link } from "@/features/links/types";
import {
  MenuItem,
  MenuSeparator,
  MenuShortcut,
} from "@/components/ui/menu";
import { IconCopy, IconEdit, IconMapPin, IconTrash } from "@tabler/icons-react";

interface LinkContextMenuProps {
  link: Link;
  onCopyUrl?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function LinkContextMenu({
  link,
  onCopyUrl,
  onEdit,
  onPin,
  onUnpin,
  onDelete,
}: LinkContextMenuProps) {
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
            <IconMapPin className="h-4 w-4" />
            Unpin
          </MenuItem>
        )
      ) : (
        onPin && (
          <MenuItem onClick={() => onPin(link.id)}>
            <IconMapPin className="h-4 w-4" />
            Pin
          </MenuItem>
        )
      )}

      <MenuSeparator />
      <MenuItem
        className="text-red-600 focus:text-red-600"
        onClick={() => onDelete?.(link.id)}
      >
        <IconTrash className="h-4 w-4" />
        Delete
        <MenuShortcut>⌘⇧⌫</MenuShortcut>
      </MenuItem>
    </>
  );
}
