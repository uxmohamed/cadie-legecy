"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { formatDate } from "@/lib/utils";
import { Favicon } from "@/components/ui/favicon";
import { Badge } from "@/components/ui/badge";
import { IconClock } from "@tabler/icons-react";

interface SidebarPanelProps {
  link: Link;
}

/**
 * Section label component for consistent styling
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
      {children}
    </div>
  );
}

/**
 * Sidebar panel component that displays link metadata,
 * AI summary, tags, and description
 */
export function SidebarPanel({ link }: SidebarPanelProps) {
  const isColor = link.content_type === "color";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Title */}
      <h2 className="text-xl font-bold text-fg leading-tight mb-3">
        {link.title}
      </h2>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-muted mb-4">
        {/* Domain with favicon */}
        {link.domain && !isColor && (
          <div className="flex items-center gap-1.5">
            <Favicon
              url={link.favicon_url || ""}
              domain={link.domain}
              className="h-4 w-4"
            />
            <span className="font-medium">{link.domain}</span>
          </div>
        )}

        {/* Color swatch for color items */}
        {isColor && link.color_value && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: link.color_value }}
            />
            <code className="font-mono text-xs">{link.color_value}</code>
          </div>
        )}

        {/* Separator */}
        {(link.domain || (isColor && link.color_value)) && (
          <span className="text-fg-subtle">·</span>
        )}

        {/* Save date */}
        <span className="text-fg-subtle">
          {formatDate(new Date(link.created_at))} ago
        </span>

        {/* Reading time */}
        {link.reading_time_minutes && link.reading_time_minutes > 0 && (
          <>
            <span className="text-fg-subtle">·</span>
            <div className="flex items-center gap-1 text-fg-subtle">
              <IconClock className="h-3.5 w-3.5" />
              <span>{link.reading_time_minutes} min read</span>
            </div>
          </>
        )}
      </div>

      {/* AI Summary */}
      {link.ai_summary && (
        <div className="mb-4">
          <SectionLabel>Summary</SectionLabel>
          <div className="pl-3 border-l-2 border-[var(--accent)] bg-[var(--accent)]/5 rounded-r-md py-2 pr-3">
            <p className="text-sm text-fg-muted leading-relaxed">
              {link.ai_summary}
            </p>
          </div>
        </div>
      )}

      {/* AI Tags */}
      {link.ai_tags && link.ai_tags.length > 0 && (
        <div className="mb-4">
          <SectionLabel>Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {link.ai_tags.map((tag, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {link.description && (
        <div className="mb-4">
          <SectionLabel>Description</SectionLabel>
          <p className="text-sm text-fg-muted leading-relaxed">
            {link.description}
          </p>
        </div>
      )}

      {/* Spacer to push action bar to bottom */}
      <div className="flex-1 min-h-4" />
    </div>
  );
}
