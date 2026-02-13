import { 
  IconCalendar, 
  IconUser, 
  IconWorld, 
  IconExternalLink,
  IconCopy,
  IconPin,
  IconPinnedOff,
  IconTrash, 
  IconDots,
  IconPlus,
  IconPencil
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import type { Link } from "@/features/links/types";
import { formatDate } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
  color: string;
}

interface SidebarPanelProps {
  link: Link;
  // Action handlers
  onOpen?: () => void;
  onCopy?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  // Spaces
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
  spaces = [],
  linkSpaces = [],
  onAddToSpace,
  onRemoveFromSpace
}: SidebarPanelProps) {
  const isColor = link.content_type === "color";

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Title - Fixed text wrapping, removed serif */}
      <h1 className="text-3xl font-medium text-fg mb-4 leading-tight whitespace-normal break-words hyphens-auto">
        {link.title}
      </h1>

      {/* Description */}
      {link.description && (
        <p className="text-sm text-fg-muted mb-8 leading-relaxed">
          {link.description}
        </p>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-xs mb-8">
        {/* Added */}
        <div className="text-fg-subtle">Added</div>
        <div className="text-fg font-medium text-right">
          {formatDate(new Date(link.created_at))} ago
        </div>
        
        {/* By (Site Name/Domain) */}
        <div className="text-fg-subtle">By</div>
        <div className="text-fg font-medium text-right truncate">
          {link.site_name || link.domain || "Unknown"}
        </div>
        
        {/* Source */}
        <div className="text-fg-subtle">Source</div>
        <div className="text-fg font-bold text-right truncate">
          {link.domain || "Direct Link"}
        </div>
      </div>

      {/* Action Buttons Row - Improved UX */}
      <div className="flex items-center gap-2 mb-8">
        {/* Primary: Visit Website */}
        <Button 
          className="flex-1 gap-2 bg-fg text-bg hover:bg-fg/90 shadow-sm h-9"
          onClick={onOpen}
        >
          <span className="text-xs font-medium">Visit Website</span>
          <IconExternalLink className="w-3.5 h-3.5" />
        </Button>

        {/* Secondary Actions Group */}
        <div className="flex items-center gap-1">
           <Button
            variant="outline"
            size="icon-lg"
            className="border-border bg-bg-surface text-fg-muted hover:text-fg"
            onClick={onCopy}
            title="Copy URL"
           >
             <IconCopy className="w-4 h-4" />
           </Button>
           
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon-lg"
                className="border-border bg-bg-surface text-fg-muted hover:text-fg"
              >
                <IconDots className="w-4 h-4" />
              </Button>
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
      
      {/* Separator */}
      <div className="h-px bg-border/50 w-full mb-6" />

    </div>
  );
}
