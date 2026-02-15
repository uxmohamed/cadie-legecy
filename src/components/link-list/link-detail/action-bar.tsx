"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconExternalLink,
  IconCopy,
  IconPin,
  IconPinnedOff,
  IconPencil,
  IconCapsuleHorizontalFilled,
  IconTrash,
} from "@tabler/icons-react";

interface ActionBarProps {
  link: Link;
  onOpen: () => void;
  onCopy: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onRename: () => void;
  onDelete: () => void;
  spaces?: Space[];
  linkSpaces?: string[];
  onAddToSpace?: (spaceId: string) => Promise<void>;
  onRemoveFromSpace?: (spaceId: string) => Promise<void>;
}

/**
 * Action bar component with primary and secondary actions
 * Sticky at bottom of sidebar in the modal
 */
export function ActionBar({
  link,
  onOpen,
  onCopy,
  onPin,
  onUnpin,
  onRename,
  onDelete,
  spaces = [],
  linkSpaces = [],
  onAddToSpace,
  onRemoveFromSpace,
}: ActionBarProps) {
  const [spacesOpen, setSpacesOpen] = React.useState(false);
  const isColor = link.content_type === "color";

  const handleSpaceToggle = async (spaceId: string, isInSpace: boolean) => {
    if (isInSpace && onRemoveFromSpace) {
      await onRemoveFromSpace(spaceId);
    } else if (!isInSpace && onAddToSpace) {
      await onAddToSpace(spaceId);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border">
      {/* Primary: Open Link */}
      {!isColor && (
        <Button onClick={onOpen} size="sm" className="gap-1.5">
          <IconExternalLink className="h-4 w-4" />
          Open
        </Button>
      )}

      {/* Secondary: Icon buttons */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCopy}
        title={isColor ? "Copy color" : "Copy URL"}
      >
        <IconCopy className="h-4 w-4" />
      </Button>

      {link.is_pinned ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onUnpin}
          title="Unpin"
        >
          <IconPinnedOff className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onPin}
          title="Pin"
        >
          <IconPin className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRename}
        title="Rename"
      >
        <IconPencil className="h-4 w-4" />
      </Button>

      {/* Spaces popover */}
      {spaces.length > 0 && (onAddToSpace || onRemoveFromSpace) && (
        <Popover open={spacesOpen} onOpenChange={setSpacesOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Add to space"
            >
              <IconCapsuleHorizontalFilled className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-fg-subtle px-2 py-1.5 mb-1">
              Spaces
            </div>
            <div className="space-y-0.5">
              {spaces.map((space) => {
                const isInSpace = linkSpaces.includes(space.id);
                return (
                  <button
                    key={space.id}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-bg-hover transition-colors text-left"
                    onClick={() => handleSpaceToggle(space.id, isInSpace)}
                  >
                    <Checkbox checked={isInSpace} />
                    <IconCapsuleHorizontalFilled
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: space.color }}
                    />
                    <span className="text-sm text-fg truncate flex-1">
                      {space.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Destructive: Delete */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        title="Delete"
        className="text-destructive hover:text-destructive hover:bg-destructive-muted"
      >
        <IconTrash className="h-4 w-4" />
      </Button>
    </div>
  );
}
