"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PreviewPanel } from "./link-detail/preview-panel";
import { SidebarPanel } from "./link-detail/sidebar-panel";
import { ActionBar } from "./link-detail/action-bar";

interface LinkDetailDialogProps {
  link: Link | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Action handlers
  onCopy?: (url: string, isColor?: boolean) => Promise<void>;
  onPin?: (id: string) => Promise<void>;
  onUnpin?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onRename?: (link: Link) => void;
  // Spaces
  spaces?: Space[];
  linkSpaces?: string[];
  onAddToSpace?: (linkId: string, spaceId: string) => Promise<void>;
  onRemoveFromSpace?: (linkId: string, spaceId: string) => Promise<void>;
}

export function LinkDetailDialog({
  link,
  open,
  onOpenChange,
  onCopy,
  onPin,
  onUnpin,
  onDelete,
  onRename,
  spaces = [],
  linkSpaces = [],
  onAddToSpace,
  onRemoveFromSpace,
}: LinkDetailDialogProps) {
  if (!link) return null;

  const isColor = link.content_type === "color";

  // Action handlers
  const handleOpen = () => {
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    const copyValue = isColor ? (link.color_value || link.title) : link.url;
    if (onCopy) {
      await onCopy(copyValue, isColor);
    } else {
      await navigator.clipboard.writeText(copyValue);
      toast.success(isColor ? "Color copied" : "URL copied");
    }
  };

  const handlePin = async () => {
    if (onPin) {
      await onPin(link.id);
    }
  };

  const handleUnpin = async () => {
    if (onUnpin) {
      await onUnpin(link.id);
    }
  };

  const handleRename = () => {
    if (onRename) {
      onRename(link);
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(link.id);
      onOpenChange(false);
    }
  };

  const handleAddToSpace = async (spaceId: string) => {
    if (onAddToSpace) {
      await onAddToSpace(link.id, spaceId);
    }
  };

  const handleRemoveFromSpace = async (spaceId: string) => {
    if (onRemoveFromSpace) {
      await onRemoveFromSpace(link.id, spaceId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[960px] p-0 overflow-hidden gap-0 max-h-[90vh]"
        showCloseButton={true}
      >
        {/* Accessible title - visually hidden */}
        <VisuallyHidden>
          <DialogPrimitive.Title>
            {link.title}
          </DialogPrimitive.Title>
        </VisuallyHidden>

        {/* Split panel layout */}
        <div className="flex flex-col sm:flex-row min-h-[500px] max-h-[90vh]">
          {/* Preview Panel - Left side (60%) */}
          <div className="w-full sm:w-[60%] aspect-video sm:aspect-auto sm:min-h-[500px] border-b sm:border-b-0 sm:border-r border-border overflow-hidden">
            <PreviewPanel link={link} />
          </div>

          {/* Sidebar Panel - Right side (40%) */}
          <div className="w-full sm:w-[40%] flex flex-col p-5 overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0">
              <SidebarPanel link={link} />
            </div>

            {/* Action Bar - Sticky at bottom */}
            <ActionBar
              link={link}
              onOpen={handleOpen}
              onCopy={handleCopy}
              onPin={handlePin}
              onUnpin={handleUnpin}
              onRename={handleRename}
              onDelete={handleDelete}
              spaces={spaces}
              linkSpaces={linkSpaces}
              onAddToSpace={handleAddToSpace}
              onRemoveFromSpace={handleRemoveFromSpace}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
