import * as React from "react";
import {
  IconCopy,
  IconDots,
  IconExternalLink,
  IconPlus,
  IconPencil,
  IconPin,
  IconPinnedOff,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Textarea } from "@/components/ui/textarea";
import type { Link } from "@/features/links/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  color: string;
}

interface SidebarPanelProps {
  link: Link;
  onOpen?: () => void;
  onCopy?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<Link>) => Promise<void> | void;
  spaces?: Space[];
  linkSpaces?: string[];
  onAddToSpace?: (spaceId: string) => Promise<void>;
  onRemoveFromSpace?: (spaceId: string) => Promise<void>;
}

export function SidebarPanel({
  link,
  onOpen,
  onCopy,
  onPin,
  onUnpin,
  onRename,
  onDelete,
  onUpdate,
}: SidebarPanelProps) {
  const isColor = link.content_type === "color";
  const isImage = link.content_type === "image";
  const isDocument = link.content_type === "document";
  const isNote = link.content_type === "note";
  const colorValue = link.color_value || link.url || link.title;
  const sourceLabel = resolveSourceLabel(link, isImage);
  const primaryAction = isColor ? onCopy : isNote ? undefined : onOpen;
  const primaryActionLabel = isColor
    ? "Copy Color"
    : isImage
      ? "Open Image"
      : isDocument
        ? "Open PDF"
        : isNote
          ? "Note"
          : "Visit Website";
  const timeLabel = formatRelativeDate(link.created_at);
  const tldrText = getTldrText(link, sourceLabel, colorValue);
  const imageDimensions =
    link.preview_image_width && link.preview_image_height
      ? `${link.preview_image_width} x ${link.preview_image_height}`
      : null;
  const [tags, setTags] = React.useState<string[]>(() =>
    sanitizeTags(link.ai_tags || [])
  );
  const [tagDraft, setTagDraft] = React.useState("");
  const [notesDraft, setNotesDraft] = React.useState(link.notes || "");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);
  const previousLinkIdRef = React.useRef(link.id);

  React.useEffect(() => {
    if (previousLinkIdRef.current === link.id) return;
    previousLinkIdRef.current = link.id;
    setTags(sanitizeTags(link.ai_tags || []));
    setTagDraft("");
    setNotesDraft(link.notes || "");
    setIsSavingNotes(false);
  }, [link.ai_tags, link.id, link.notes]);

  const persistTags = React.useCallback(
    (nextTags: string[]) => {
      if (!onUpdate) return;
      void onUpdate({ ai_tags: nextTags.length > 0 ? nextTags : null });
    },
    [onUpdate]
  );

  const handleAddTag = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalized = normalizeTag(tagDraft);
      if (!normalized) return;

      if (tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
        toast.info("Tag already exists");
        setTagDraft("");
        return;
      }

      const nextTags = sanitizeTags([...tags, normalized]);
      setTags(nextTags);
      setTagDraft("");
      persistTags(nextTags);
    },
    [tagDraft, tags, persistTags]
  );

  const handleRemoveTag = React.useCallback(
    (tagToRemove: string) => {
      const nextTags = tags.filter((tag) => tag !== tagToRemove);
      setTags(nextTags);
      persistTags(nextTags);
    },
    [tags, persistTags]
  );

  const handleSaveNotes = React.useCallback(async () => {
    if (!onUpdate) return;

    const trimmed = notesDraft.trim();
    const nextNotes = trimmed.length > 0 ? trimmed : null;
    const currentNotes = link.notes || null;
    if (nextNotes === currentNotes) return;

    setIsSavingNotes(true);
    try {
      await onUpdate({ notes: nextNotes });
      toast.success(nextNotes ? "Note saved" : "Note cleared");
    } finally {
      setIsSavingNotes(false);
    }
  }, [link.notes, notesDraft, onUpdate]);

  const handleClearNotes = React.useCallback(() => {
    setNotesDraft("");
  }, []);

  return (
    <div className="flex h-full flex-col font-sans">
      <header className="border-b border-border/60 pb-4 mb-4">
        <h1 className="text-[2rem] font-medium text-fg leading-tight whitespace-normal break-words hyphens-auto">
          {link.title}
        </h1>
        <div className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
          <span>{timeLabel}</span>
        </div>
      </header>

      <SectionTitle label="TLDR" />
      <div className="rounded-lg border border-border bg-bg-surface px-3 py-2.5 text-sm text-fg-muted leading-relaxed mb-5">
        {tldrText}
      </div>

      {(isColor || (isImage && imageDimensions) || isDocument || isNote) && (
        <>
          <SectionTitle label="DETAILS" />
          <div className="mb-5 space-y-2">
            {isColor && (
              <>
                <div className="rounded-lg border border-border bg-bg-surface px-3 py-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-fg-subtle">Value</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.14)] shrink-0"
                      style={{ backgroundColor: colorValue }}
                    />
                    <code className="text-xs font-mono font-semibold text-fg truncate">
                      {colorValue}
                    </code>
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-bg-surface px-3 py-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-fg-subtle">Format</span>
                  <span className="text-xs font-medium text-fg">
                    {getColorFormat(colorValue)}
                  </span>
                </div>
              </>
            )}

            {isImage && imageDimensions && (
              <div className="rounded-lg border border-border bg-bg-surface px-3 py-2 flex items-center justify-between gap-3">
                <span className="text-xs text-fg-subtle">Dimensions</span>
                <span className="text-xs font-medium text-fg">
                  {imageDimensions}
                </span>
              </div>
            )}

            {isDocument && (
              <div className="rounded-lg border border-border bg-bg-surface px-3 py-2 flex items-center justify-between gap-3">
                <span className="text-xs text-fg-subtle">Type</span>
                <span className="text-xs font-medium text-fg">PDF document</span>
              </div>
            )}

            {isNote && (
              <div className="rounded-lg border border-border bg-bg-surface px-3 py-2 flex items-center justify-between gap-3">
                <span className="text-xs text-fg-subtle">Type</span>
                <span className="text-xs font-medium text-fg">Rich text note</span>
              </div>
            )}

          </div>
        </>
      )}

      <SectionTitle label="MIND TAGS" />
      <div className="mb-5 space-y-2.5">
        <form onSubmit={handleAddTag} className="flex items-center gap-2">
          <Input
            size="sm"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            placeholder="Add a tag"
            maxLength={64}
            className="h-8"
            disabled={!onUpdate}
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="h-8 shrink-0 gap-1.5"
            disabled={!onUpdate || normalizeTag(tagDraft).length === 0}
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add
          </Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {tags.length === 0 && (
            <span className="text-xs text-fg-subtle">
              No tags yet
            </span>
          )}
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" size="sm" className="gap-1 pr-1">
              <span>{tag}</span>
              {onUpdate && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-sm p-0.5 text-fg-subtle hover:text-fg"
                  aria-label={`Remove ${tag} tag`}
                >
                  <IconX className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      </div>

      <SectionTitle label="MIND NOTES" />
      <div className="mb-5 space-y-2">
        <Textarea
          value={notesDraft}
          onChange={(event) => setNotesDraft(event.target.value)}
          placeholder="Type here to add a note..."
          className="min-h-24 text-sm text-fg-muted"
          disabled={!onUpdate || isSavingNotes}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void handleSaveNotes();
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleSaveNotes()}
            disabled={!onUpdate || isSavingNotes || notesDraft.trim() === (link.notes || "")}
          >
            Save note
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearNotes}
            disabled={!onUpdate || isSavingNotes || notesDraft.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 gap-2 bg-fg text-bg hover:bg-fg/90 h-9"
            onClick={primaryAction}
            disabled={!primaryAction}
          >
            <span className="text-xs font-medium">{primaryActionLabel}</span>
            {isColor ? (
              <IconCopy className="w-3.5 h-3.5" />
            ) : (
              <IconExternalLink className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon-lg"
            className="border-border bg-bg-surface text-fg-muted hover:text-fg"
            onClick={onCopy}
            title={isColor ? "Copy color" : "Copy URL"}
          >
            <IconCopy className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="border-border bg-bg-surface text-fg-muted hover:text-fg"
                />
              }
            >
              <IconDots className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={link.is_pinned ? onUnpin : onPin} className="gap-2">
                {link.is_pinned ? (
                  <>
                    <IconPinnedOff className="w-4 h-4 text-fg-muted" />
                    <span>Unpin</span>
                  </>
                ) : (
                  <>
                    <IconPin className="w-4 h-4 text-fg-muted" />
                    <span>Pin</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename} className="gap-2">
                <IconPencil className="w-4 h-4 text-fg-muted" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive gap-2">
                <IconTrash className="w-4 h-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-fg-subtle mb-2">
      {label}
    </div>
  );
}

function formatRelativeDate(createdAt: string): string {
  const dateStr = formatDate(new Date(createdAt));
  return dateStr === "now" ? "Just now" : `${dateStr} ago`;
}

function getTldrText(link: Link, sourceLabel: string, colorValue: string): string {
  if (link.ai_summary) return link.ai_summary;
  if (link.description) return link.description;

  if (link.content_type === "color") {
    return `Saved color value ${colorValue}.`;
  }

  if (link.content_type === "image") {
    return `Image saved from ${sourceLabel}.`;
  }

  if (link.content_type === "document") {
    return "PDF document saved. Quick metadata skim enabled; deep content analysis is intentionally skipped.";
  }

  if (link.content_type === "note") {
    return "Rich text note saved for fast capture and reference.";
  }

  return `Saved link from ${sourceLabel}.`;
}

function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/g, "-").toLowerCase();
}

function sanitizeTags(values: string[]): string[] {
  const unique = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeTag(value);
    if (!normalized) continue;
    if (unique.has(normalized)) continue;
    unique.add(normalized);
    result.push(normalized);
    if (result.length >= 20) break;
  }

  return result;
}

function resolveSourceLabel(link: Link, isImage: boolean): string {
  if (isImage) {
    return getHostname(link.url) || "Image asset";
  }
  return (
    normalizeDomain(link.domain) ||
    getHostname(link.final_url || link.canonical_url || link.url) ||
    "Direct link"
  );
}

function normalizeDomain(domain: string | null): string | null {
  if (!domain || domain === "color" || domain === "image") return null;
  return domain;
}

function getHostname(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getColorFormat(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return "HEX";
  if (/^rgba?\(/i.test(trimmed)) return "RGB";
  if (/^hsla?\(/i.test(trimmed)) return "HSL";
  if (/^(oklch|oklab|lab|lch|hwb|color)\(/i.test(trimmed)) return "CSS Color";
  return "Named color";
}
