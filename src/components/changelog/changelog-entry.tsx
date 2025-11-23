"use client";

import { useMDXComponent } from "next-contentlayer/hooks";
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
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 font-custom">
            {entry.title}
          </h2>

          {/* Tags */}
          {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="h-6 w-fit px-2 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full border border-neutral-200 flex items-center justify-center"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-neutral-600 [&>p]:mb-4 [&>p:last-child]:mb-0 [&>p]:tracking-tight [&>p]:text-balance [&>p]:leading-7 [&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:tracking-tight [&>h1]:text-balance [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:text-neutral-900 [&>h1]:scroll-mt-8 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:tracking-tight [&>h2]:text-balance [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-neutral-900 [&>h2]:scroll-mt-8 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:tracking-tight [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-neutral-900 [&>h3]:scroll-mt-8 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>ol]:space-y-2 [&>li]:mb-1.5 [&>li]:leading-7 [&>a]:text-brand [&>a]:no-underline [&>a]:hover:text-brand-hover [&>code]:bg-neutral-100 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>code]:text-neutral-800 [&>pre]:bg-neutral-50 [&>pre]:border [&>pre]:border-neutral-200 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:mb-4 [&>pre]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-neutral-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-neutral-600 [&>blockquote]:my-4 [&>img]:rounded-md [&>img]:border [&>img]:border-neutral-200 [&>img]:my-6 [&>img]:w-full [&>strong]:font-semibold [&>strong]:text-neutral-900">
          <MDXContent />
        </div>
      </div>
    </article>
  );
}
