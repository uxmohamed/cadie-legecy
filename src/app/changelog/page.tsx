import type { Metadata } from "next";
import { allChangelogs } from "contentlayer/generated";
import { ChangelogList } from "@/components/changelog/changelog-list";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Changelog | Caddy",
  description: "Stay up to date with the latest updates and improvements to Caddy",
};

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

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

  // Debug: Log if entries are empty (remove in production)
  if (entries.length === 0 && process.env.NODE_ENV === 'development') {
    console.warn('No changelog entries found. Make sure Contentlayer has processed the MDX files.');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div>
        <div className="max-w-5xl mx-auto relative">
          <div className="p-3 flex items-center justify-between relative">
            <div className="flex items-center">
              <Link href="/">
                <Logo className="h-6 w-auto text-neutral-900" />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
              <Link href="/changelog">
                <Button className="py-2 px-4 bg-transparent border-0 text-neutral-600 text-sm font-medium rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                  Changelog
                </Button>
              </Link>
              <a
                href="https://x.com/caddyapp_"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="py-2 px-4 bg-transparent border-0 text-neutral-600 text-sm font-medium rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                  X (Twitter)
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth">
                <Button className="py-2 px-4 bg-transparent border-0 text-neutral-600 text-sm font-medium rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                  Log In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="py-2 px-4 bg-neutral-800 border-0 text-white text-sm font-medium rounded-xl shadow-none hover:bg-neutral-800 transition-colors duration-150">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {/* Timeline */}
        <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-10">
          <div className="mb-12">
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 font-custom">
              Changelog
            </h1>
          </div>
          <ChangelogList entries={sortedEntries} />
        </div>
      </main>
    </div>
  );
}

