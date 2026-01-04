import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-tertiary)] mt-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Copyright */}
          <div className="text-sm text-[var(--text-secondary)]">
            © {new Date().getFullYear()} Cadie. All rights reserved.
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-0.5">
            <Link href="/changelog">
              <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                Changelog
              </Button>
            </Link>
            <a
              href="https://x.com/cadieapp_"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                X (Twitter)
              </Button>
            </a>
            <Link href="/terms">
              <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                Terms of Service
              </Button>
            </Link>
            <Link href="/privacy">
              <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                Privacy Policy
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
