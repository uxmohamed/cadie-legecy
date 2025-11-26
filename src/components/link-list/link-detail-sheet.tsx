"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { formatDate } from "@/lib/utils";
import { Favicon } from "@/components/ui/favicon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/blocks/editor-00/editor";
import type { SerializedEditorState } from "lexical";
import { IconDots, IconExternalLink, IconCopy, IconEdit, IconMapPin, IconTrash, IconChevronUp, IconChevronDown, IconX, IconFile, IconWorld, IconCalendar, IconClock, IconPalette } from "@tabler/icons-react";
import { extractTextFromRichText } from "@/lib/rich-text-utils";
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from "@/components/ui/menu";

interface LinkDetailSheetProps {
  link: Link | null;
  links: Link[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkChange?: (link: Link) => void;
  onEdit?: (link: Link) => void;
  onCopyUrl?: (url: string) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function LinkDetailSheet({
  link,
  links,
  currentIndex,
  open,
  onOpenChange,
  onLinkChange,
  onEdit,
  onCopyUrl,
  onPin,
  onUnpin,
  onDelete,
}: LinkDetailSheetProps) {
  const [copied, setCopied] = React.useState(false);

  if (!link || currentIndex < 0) return null;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const previousLink = links[currentIndex - 1];
      onLinkChange?.(previousLink);
    }
  };

  const handleNext = () => {
    if (currentIndex < links.length - 1) {
      const nextLink = links[currentIndex + 1];
      onLinkChange?.(nextLink);
    }
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < links.length - 1;

  const isColor = link.content_type === "color";
  const isRichText = link.content_type === "text";
  const isUrl = link.content_type === "url";

  const handleCopyUrl = async () => {
    if (isColor) {
      await navigator.clipboard.writeText(link.color_value || link.title);
    } else if (isUrl) {
      await navigator.clipboard.writeText(link.url);
    }
    setCopied(true);
    onCopyUrl?.(link.url);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    if (isUrl) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[540px] overflow-y-auto p-0"
        showCloseButton={false}
      >
        {/* Header with menu */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <span className="text-xs">&gt;&gt;</span>
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Menu>
              <MenuTrigger
                className="h-6 w-6 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center rounded-md"
              >
                <IconDots className="h-3.5 w-3.5" />
              </MenuTrigger>
              <MenuPopup align="end">
                {isUrl && (
                  <>
                    <MenuItem onClick={handleOpenLink}>
                      <IconExternalLink className="h-4 w-4" />
                      Open Link
                    </MenuItem>
                    <MenuItem onClick={handleCopyUrl}>
                      <IconCopy className="h-4 w-4" />
                      {copied ? "Copied!" : "Copy Link"}
                    </MenuItem>
                  </>
                )}
                {!isUrl && (
                  <MenuItem onClick={handleCopyUrl}>
                    <IconCopy className="h-4 w-4" />
                    {copied ? "Copied!" : isColor ? "Copy Color" : "Copy"}
                  </MenuItem>
                )}
                {onEdit && (
                  <>
                    <MenuSeparator />
                    <MenuItem
                      onClick={() => {
                        onEdit(link);
                        onOpenChange(false);
                      }}
                    >
                      <IconEdit className="h-4 w-4" />
                      Edit
                    </MenuItem>
                  </>
                )}
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

                {onDelete && (
                  <>
                    <MenuSeparator />
                    <MenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this link?")) {
                          onDelete(link.id);
                          onOpenChange(false);
                        }
                      }}
                    >
                      <IconTrash className="h-4 w-4" />
                      Delete
                    </MenuItem>
                  </>
                )}
              </MenuPopup>
            </Menu>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="h-6 w-6 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNext}
              disabled={!canGoNext}
              className="h-6 w-6 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <IconChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <IconX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Large Image/Thumbnail */}
          {link.og_image_url ? (
            <div className="w-full rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
              <img
                src={link.og_image_url}
                alt={link.title}
                className="w-full h-auto object-contain"
              />
            </div>
          ) : isColor && link.color_value ? (
            <div
              className="w-full aspect-square rounded-lg border border-neutral-200"
              style={{ backgroundColor: link.color_value }}
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              {isRichText ? (
                <IconFile className="h-16 w-16 text-neutral-400" />
              ) : link.domain ? (
                <div className="h-16 w-16">
                  <Favicon
                    url={link.favicon_url || ""}
                    domain={link.domain}
                    className="h-16 w-16"
                  />
                </div>
              ) : (
                <IconWorld className="h-16 w-16 text-neutral-400" />
              )}
            </div>
          )}

          {/* Title and Domain */}
          <div>
            <SheetTitle className="text-2xl font-bold text-neutral-900 mb-2">
              {link.title}
            </SheetTitle>
            {link.domain && !isColor && !isRichText && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <IconWorld className="h-4 w-4 text-neutral-400" />
                <span>{link.domain}</span>
              </div>
            )}
            {isColor && link.color_value && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mt-2">
                <IconWorld className="h-4 w-4 text-neutral-400" />
                <code className="font-mono text-sm">{link.color_value}</code>
              </div>
            )}
            {isRichText && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mt-2">
                <IconFile className="h-4 w-4 text-neutral-400" />
                <span>Rich Text Note</span>
              </div>
            )}
          </div>

          {/* Key Metadata Section */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <IconWorld className="h-4 w-4 text-neutral-400" />
              <span>{formatDate(new Date(link.created_at))}</span>
            </div>
            {link.read_at && (
              <div className="flex items-center gap-2">
                <IconWorld className="h-4 w-4 text-neutral-400" />
                <span>Read {formatDate(new Date(link.read_at))}</span>
              </div>
            )}
            {isUrl && (
              <div className="flex items-center gap-2">
                <IconExternalLink className="h-4 w-4 text-neutral-400" />
                <span>URL Link</span>
              </div>
            )}
          </div>

          {/* Status Card (if pinned or archived) */}
          {(link.is_pinned || link.is_favorite) && (
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 text-sm">
                    {link.is_pinned ? "Pinned" : "Favorited"}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {link.is_pinned
                      ? "This link is pinned to the top"
                      : "This link is in your favorites"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description / About Section */}
          {link.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">About</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {link.description}
              </p>
            </div>
          )}

          {/* Rich Text Content */}
          {isRichText && link.rich_text_content && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">Content</h3>
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 min-h-[200px]">
                <Editor
                  editorSerializedState={link.rich_text_content as SerializedEditorState}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {link.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">Notes</h3>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {link.notes}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {link.ai_summary && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">AI Summary</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {link.ai_summary}
              </p>
            </div>
          )}

          {/* AI Tags */}
          {link.ai_tags && link.ai_tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {link.ai_tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL Link */}
          {isUrl && link.url && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">URL</h3>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
              >
                {link.url}
              </a>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
