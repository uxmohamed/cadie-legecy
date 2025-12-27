"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { formatDate } from "@/lib/utils";
import { Favicon } from "@/components/ui/favicon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconWorld, IconExternalLink } from "@tabler/icons-react";

interface LinkDetailDialogProps {
  link: Link | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkDetailDialog({
  link,
  open,
  onOpenChange,
}: LinkDetailDialogProps) {
  if (!link) return null;

  const isColor = link.content_type === "color";
  const isUrl = link.content_type === "url";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
        {/* Open Graph Image or Placeholder */}
        <div className="w-full aspect-video bg-[var(--bg-l1-solid)] relative border-b border-[var(--border-primary)]">
          {link.og_image_url ? (
            <img
              src={link.og_image_url}
              alt={link.title}
              className="w-full h-full object-cover"
            />
          ) : isColor && link.color_value ? (
            <div
              className="w-full h-full"
              style={{ backgroundColor: link.color_value }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {link.domain ? (
                <div className="transform scale-150">
                  <Favicon
                    url={link.favicon_url || ""}
                    domain={link.domain}
                    className="h-16 w-16"
                  />
                </div>
              ) : (
                <IconWorld className="h-16 w-16 text-[var(--text-tertiary)]" />
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[var(--text-primary)] leading-tight">
              {link.title}
            </DialogTitle>
          </DialogHeader>

          {/* Domain + Favicon */}
          {(link.domain || isColor) && (
            <div className="flex items-center gap-2">
              {link.domain && (
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Favicon
                    url={link.favicon_url || ""}
                    domain={link.domain}
                    className="h-4 w-4"
                  />
                  <span>{link.domain}</span>
                </div>
              )}
              {isColor && link.color_value && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                   <div 
                    className="w-4 h-4 rounded-full border border-[var(--border-primary)]"
                    style={{ backgroundColor: link.color_value }} 
                   />
                   <code className="font-mono text-xs">{link.color_value}</code>
                </div>
              )}
            </div>
          )}
          
          {/* Metadata: Save Date */}
           <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <span>Saved {formatDate(new Date(link.created_at))}</span>
           </div>

          {/* Description */}
          {link.description && (
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {link.description}
            </div>
          )}
          
           {/* URL Link (if it is a URL) */}
           {isUrl && (
              <div className="pt-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue-primary)] hover:underline"
                >
                  <IconExternalLink className="h-4 w-4" />
                  {link.url}
                </a>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
