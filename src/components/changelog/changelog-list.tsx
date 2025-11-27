"use client";

import { useMemo } from "react";
import type { ChangelogEntry } from "@/types/changelog";
import { ChangelogEntryComponent } from "./changelog-entry";

interface ChangelogListProps {
  entries: ChangelogEntry[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ChangelogList({ entries }: ChangelogListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-tertiary)]">No changelog entries yet.</p>
      </div>
    );
  }

  // Sort entries by date (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [entries]);

  return (
    <div className="relative">
      {sortedEntries.map((entry, index) => {
        const date = new Date(entry.date);
        const formattedDate = formatDate(date);

        return (
          <div key={entry._id} className="relative">
            <div className="flex flex-col md:flex-row gap-y-6">
              {/* Left column - Date */}
              <div className="md:w-48 flex-shrink-0">
                <div className="md:sticky md:top-8">
                  <time className="text-sm font-medium text-[var(--text-tertiary)] block mb-3">
                    {formattedDate}
                  </time>
                </div>
              </div>

              {/* Right column - Content with Timeline */}
              <div className="flex-1 justify-start md:pl-8 relative pb-10">
                {/* Vertical timeline line */}
                <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-[var(--border-primary)]">
                  {/* Timeline dot */}
                  <div
                    className={`hidden md:block absolute top-0 -translate-x-1/2 size-1.5 ml-[0.5px] rounded-full z-10 ${
                      index === 0 ? "bg-[var(--accent-blue-primary)]" : "bg-[var(--bg-inverse-primary)]"
                    }`}
                  />
                </div>

                <ChangelogEntryComponent entry={entry} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
