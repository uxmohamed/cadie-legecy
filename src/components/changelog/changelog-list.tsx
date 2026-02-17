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
  // Sort entries by date (newest first), then by version (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      // If dates are equal, sort by version (descending)
      const versionA = a.version || "0.0.0";
      const versionB = b.version || "0.0.0";
      return versionB.localeCompare(versionA, undefined, { numeric: true });
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-fg-subtle">No changelog entries yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {sortedEntries.map((entry, index) => {
        const date = new Date(entry.date);
        const formattedDate = formatDate(date);

        return (
          <div key={entry._id} className="relative">
            <div className="flex flex-col md:flex-row gap-y-4 md:gap-y-6">
              {/* Left column - Date */}
              <div className="md:w-48 flex-shrink-0">
                <div className="md:sticky md:top-8 h-5 flex items-center">
                  <time className="text-sm font-medium text-fg-subtle">
                    {formattedDate}
                  </time>
                </div>
              </div>

              {/* Right column - Content with Timeline */}
              <div className="flex-1 justify-start md:pl-8 relative pb-8 md:pb-10">
                {/* Vertical timeline line - hidden for last entry */}
                {index < sortedEntries.length - 1 && (
                  <div className="hidden md:block absolute top-2.5 left-0 w-px h-full -translate-x-1/2 bg-border" />
                )}
                {/* Sticky timeline dot - moves with date, hidden if only one entry */}
                {sortedEntries.length > 1 && (
                  <div className="hidden md:block absolute left-0 top-0 h-full z-10">
                    <div className="sticky top-8 h-5 flex items-center">
                      <div className="-translate-x-1/2 size-1.5 rounded-full bg-[var(--accent)]" />
                    </div>
                  </div>
                )}

                <ChangelogEntryComponent entry={entry} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
