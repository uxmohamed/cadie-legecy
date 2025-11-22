"use client";

import type { Link } from "@/types";
import {
  MenuItem,
  MenuSeparator,
  MenuShortcut,
} from "@/components/ui/menu";
import {
  Copy,
  Edit,
  Archive,
  Trash,
  Pin,
  PinOff,
} from "lucide-react";

interface LinkContextMenuProps {
  link: Link;
  onCopyUrl?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function LinkContextMenu({
  link,
  onCopyUrl,
  onEdit,
  onPin,
  onUnpin,
  onArchive,
  onDelete,
}: LinkContextMenuProps) {
  return (
    <>
      <MenuItem onClick={() => onCopyUrl?.(link.url)}>
        <Copy className="h-4 w-4" />
        Copy URL
        <MenuShortcut>⌘C</MenuShortcut>
      </MenuItem>
      <MenuItem onClick={() => onEdit?.(link)}>
        <Edit className="h-4 w-4" />
        Edit
        <MenuShortcut>⌘E</MenuShortcut>
      </MenuItem>
      {link.is_pinned ? (
        <MenuItem onClick={() => onUnpin?.(link.id)}>
          <PinOff className="h-4 w-4" />
          Unpin
        </MenuItem>
      ) : (
        <MenuItem onClick={() => onPin?.(link.id)}>
          <Pin className="h-4 w-4" />
          Pin
        </MenuItem>
      )}
      <MenuItem onClick={() => onArchive?.(link.id)}>
        <Archive className="h-4 w-4" />
        Archive
        <MenuShortcut>⌘⌫</MenuShortcut>
      </MenuItem>
      <MenuSeparator />
      <MenuItem variant="destructive" onClick={() => onDelete?.(link.id)}>
        <Trash className="h-4 w-4" />
        Delete
        <MenuShortcut>⌘⇧⌫</MenuShortcut>
      </MenuItem>
    </>
  );
}
