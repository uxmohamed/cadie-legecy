"use client";

import { useMDXComponent } from "next-contentlayer2/hooks";
import type { ChangelogEntry } from "@/types/changelog";

interface ChangelogEntryProps {
  entry: ChangelogEntry;
}

export function ChangelogEntryComponent({ entry }: ChangelogEntryProps) {
  const MDXContent = useMDXComponent(entry.body.code);

  return (
    <article
      id={entry._raw.flattenedPath.replace("changelog/", "")}
      className="scroll-mt-24"
    >
      <div className="space-y-6 relative z-10">
        {/* Title and Tags */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-fg font-custom">
            {entry.title}
          </h2>

          {/* Tags */}
          {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="h-6 w-fit px-2 text-xs font-medium bg-bg-surface text-fg-muted rounded-full border border-border flex items-center justify-center"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-[color-mix(in_oklab,var(--fg)_88%,transparent)] [&>p]:mb-4 [&>p:last-child]:mb-0 [&>p]:tracking-tight [&>p]:text-balance [&>p]:leading-7 [&>h1]:text-xl [&>h1]:font-semibold [&>h1]:tracking-tight [&>h1]:text-balance [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:text-[color-mix(in_oklab,var(--fg)_88%,transparent)] [&>h1]:scroll-mt-8 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:tracking-tight [&>h2]:text-balance [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-[color-mix(in_oklab,var(--fg)_88%,transparent)] [&>h2]:scroll-mt-8 [&>h3]:text-[17px] [&>h3]:font-semibold [&>h3]:tracking-tight [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-[color-mix(in_oklab,var(--fg)_88%,transparent)] [&>h3]:scroll-mt-8 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>ol]:space-y-2 [&>li]:mb-1.5 [&>li]:leading-7 [&>a]:text-[var(--accent)] [&>a]:no-underline [&>a]:hover:text-[var(--accent-hover)] [&>code]:bg-bg-surface [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>code]:text-fg [&>pre]:bg-bg [&>pre]:border [&>pre]:border-border [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:mb-4 [&>pre]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--border-muted)] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-fg-muted [&>blockquote]:my-4 [&_img]:rounded-[12px] [&_img]:outline [&_img]:outline-1 [&_img]:outline-[var(--border)] [&_img]:-outline-offset-1 [&_img]:my-6 [&_img]:w-full [&_img]:block [&_img]:mx-auto [&_img]:overflow-hidden [&>strong]:font-semibold [&>strong]:text-fg">
          <MDXContent />
        </div>
      </div>
    </article>
  );
}
