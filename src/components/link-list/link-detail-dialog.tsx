"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { 
  IconX, 
  IconChevronUp, 
  IconChevronDown,
  IconExternalLink
} from "@tabler/icons-react";
import { PreviewPanel } from "./link-detail/preview-panel";
import { SidebarPanel } from "./link-detail/sidebar-panel";
import { cleanUrl } from "@/lib/utils";

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
  onUpdate?: (id: string, updates: Partial<Link>) => Promise<void>;
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
  onUpdate,
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
  const copyValue = isColor ? (link.color_value || link.url) : link.url;

  const handleOpen = () => {
    if (isColor) return;
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[120] min-h-dvh bg-bg-scrim opacity-70 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-[130] grid place-items-center p-2 sm:p-4 xl:py-6">
          <DialogPrimitive.Popup className="group/popup relative flex h-full w-full justify-center pointer-events-none transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <DialogPrimitive.Title className="sr-only">
              {link.title}
            </DialogPrimitive.Title>

            <div className="pointer-events-auto relative box-border flex flex-col w-[95vw] md:w-[92vw] max-w-[1200px] h-[95vh] max-h-[92vh] gap-0 border border-border bg-bg p-0 shadow-2xl outline outline-1 outline-border/60 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[starting-style]/popup:scale-110 sm:rounded-2xl overflow-hidden">
              <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_420px] h-full min-h-0">
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
                <div className="w-full md:w-auto md:min-w-[320px] flex flex-col h-[40%] md:h-full border-t md:border-t-0 md:border-l border-border bg-bg-elevated relative">
                  <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 md:pt-14">
                    <SidebarPanel
                      link={link}
                      onOpen={handleOpen}
                      onCopy={() => onCopy?.(copyValue, isColor)}
                      onPin={() => onPin?.(link.id)}
                      onUnpin={() => onUnpin?.(link.id)}
                      onRename={() => onRename?.(link)}
                      onDelete={() => onDelete?.(link.id)}
                      onUpdate={(updates) => onUpdate?.(link.id, updates)}
                      spaces={spaces}
                      linkSpaces={linkSpaces}
                      onAddToSpace={async (spaceId) => { if (onAddToSpace) await onAddToSpace(link.id, spaceId); }}
                      onRemoveFromSpace={async (spaceId) => { if (onRemoveFromSpace) await onRemoveFromSpace(link.id, spaceId); }}
                    />
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
                <DialogPrimitive.Close className="rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-black/5 dark:bg-white/10 p-2">
                  <IconX className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function BrowserAddressBar({ link }: { link: Link }) {
  const data = getAddressBarData(link);
  const faviconDomain = data.faviconDomain;
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-surface border-b border-border w-full">
      <div className="flex-1 flex items-center gap-2 text-xs text-fg-muted overflow-hidden pl-1 bg-bg-muted/50 rounded-md px-2 py-1.5">
        {data.kind === "color" ? (
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.14)] shrink-0"
            style={{ backgroundColor: data.value }}
          />
        ) : faviconDomain ? (
          <img 
            src={`https://www.google.com/s2/favicons?domain=${faviconDomain}&sz=32`}
            alt=""
            className="w-3.5 h-3.5 opacity-60"
          />
        ) : (
          <span className="w-3.5 h-3.5 rounded-full bg-bg-emphasis shrink-0" />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[10px] uppercase tracking-wide text-fg-subtle">
            {data.label}
          </div>
          <div className="truncate font-medium text-fg/80">
            {data.value}
          </div>
        </div>
      </div>

      {data.openUrl ? (
        <button
          type="button"
          onClick={() => {
            if (!data.openUrl) return;
            window.open(data.openUrl, "_blank", "noopener,noreferrer");
          }}
          className="p-1 rounded-sm text-fg-subtle opacity-70 hover:opacity-100 hover:bg-bg-muted transition-colors"
          aria-label="Open in new tab"
        >
          <IconExternalLink className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-wide text-fg-subtle bg-bg-muted rounded px-2 py-1">
          color
        </span>
      )}
    </div>
  );
}

function getAddressBarData(link: Link): {
  kind: "url" | "image" | "color";
  label: string;
  value: string;
  openUrl: string | null;
  faviconDomain: string | null;
} {
  const kind = link.content_type;

  if (kind === "color") {
    return {
      kind,
      label: "Color Value",
      value: link.color_value || link.url || link.title,
      openUrl: null,
      faviconDomain: null,
    };
  }

  if (kind === "image") {
    const host = getHostname(link.url);
    const imageTitle = link.title?.trim();
    return {
      kind,
      label: "Image",
      value: imageTitle && imageTitle !== link.url ? imageTitle : "Image asset",
      openUrl: link.url,
      faviconDomain: host,
    };
  }

  const resolvedUrl = link.final_url || link.canonical_url || link.url;
  const domain = getDomain(link) || getHostname(resolvedUrl);
  return {
    kind: "url",
    label: link.site_name || domain || "Website",
    value: cleanUrl(resolvedUrl),
    openUrl: resolvedUrl,
    faviconDomain: domain,
  };
}

function getDomain(link: Link): string | null {
  if (!link.domain) return null;
  if (link.domain === "color" || link.domain === "image") return null;
  return link.domain;
}

function getHostname(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
