"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { 
  IconX, 
  IconChevronUp, 
  IconChevronDown 
} from "@tabler/icons-react";
import { PreviewPanel } from "./link-detail/preview-panel";
import { SidebarPanel } from "./link-detail/sidebar-panel";
import { IconExternalLink } from "@tabler/icons-react";

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
  // Navigation
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
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
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: LinkDetailDialogProps) {
  // Keyboard Navigation — must be before any early return to satisfy Rules of Hooks
  React.useEffect(() => {
    if (!open || !link) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hasNext && onNext) onNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (hasPrev && onPrev) onPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, link, hasNext, hasPrev, onNext, onPrev]);

  if (!link) return null;

  const isColor = link.content_type === "color";

  const handleOpen = () => {
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 flex flex-col w-[95vw] h-[95vh] translate-x-[-50%] translate-y-[-50%] gap-0 border border-border bg-bg p-0 shadow-2xl transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:rounded-2xl overflow-hidden"
        >
          {/* Accessible title - visually hidden */}
          <DialogPrimitive.Title className="sr-only">
            {link.title}
          </DialogPrimitive.Title>

          <div className="flex flex-col md:flex-row h-full min-h-0">
            {/* Left Panel: Browser Preview */}
            <div className="flex-1 flex flex-col p-6 min-h-0 min-w-0 bg-bg-muted">
              
              {/* Browser Window Frame */}
              <div className="flex-1 flex flex-col bg-bg-surface rounded-lg border border-border overflow-hidden shadow-sm relative">
                <BrowserAddressBar link={link} />
                
                {/* Content Container with Spacing as requested */}
                <div className="flex-1 p-4 md:p-8 overflow-hidden flex items-center justify-center bg-bg-surface">
                   <div className="w-full h-full relative flex items-center justify-center">
                      <PreviewPanel link={link} />
                   </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Sidebar */}
            <div className="w-full md:w-[320px] lg:w-[400px] flex-shrink-0 flex flex-col h-[40%] md:h-full border-t md:border-t-0 md:border-l border-border bg-bg-elevated relative">
              <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 md:pt-14">
                <SidebarPanel link={link} />
              </div>
            </div>
          </div>

          {/* Navigation & Close Controls */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            
            {/* Navigation Arrows */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-md p-1 backdrop-blur-sm">
               <button 
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="p-1 rounded-sm text-fg-muted hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous item (Up Arrow)"
               >
                  <IconChevronUp className="w-4 h-4" />
               </button>
               <button 
                  onClick={onNext}
                  disabled={!hasNext}
                  className="p-1 rounded-sm text-fg-muted hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next item (Down Arrow)"
               >
                  <IconChevronDown className="w-4 h-4" />
               </button>
            </div>

            {/* Close Button */}
            <DialogPrimitive.Close className="rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-black/5 dark:bg-white/10 p-2">
              <IconX className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function BrowserAddressBar({ link }: { link: Link }) {
  const isColor = link.content_type === "color";
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-surface border-b border-border w-full">
      {/* URL Content */}
      <div className="flex-1 flex items-center gap-2 text-xs text-fg-muted overflow-hidden pl-1 bg-bg-muted/50 rounded-md px-2 py-1.5">
         {!isColor && link.domain && (
            <img 
              src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`}
              alt=""
              className="w-3.5 h-3.5 opacity-60"
            />
         )}
         <span className="truncate flex-1 font-medium opacity-70">
           {link.url}
         </span>
      </div>
      
      <IconExternalLink className="w-3.5 h-3.5 text-fg-subtle opacity-50" />
    </div>
  );
}
