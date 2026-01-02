import type { Metadata } from "next";
import { allChangelogs } from "contentlayer/generated";
import { ChangelogHeader } from "@/components/changelog/changelog-header";
import { ChangelogList } from "@/components/changelog/changelog-list";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Changelog | Cadie",
  description: "Stay up to date with the latest updates and improvements to Cadie",
};



function sortEntriesByDate(entries: typeof allChangelogs) {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first
  });
}

export default function ChangelogPage() {
  // Handle case where allChangelogs might not be generated yet
  const entries = Array.isArray(allChangelogs) ? allChangelogs : [];
  const sortedEntries = sortEntriesByDate(entries);


  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-main-container)]">
      {/* Header */}
      <ChangelogHeader />

      {/* Main Content */}
      <main className="flex-1">
        {/* Timeline */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-12">
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] font-custom">
              Changelog
            </h1>
          </div>
          <ChangelogList entries={sortedEntries} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

