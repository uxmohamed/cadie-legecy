import { LinkListSkeleton } from "./link-list";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-bg relative">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-20 bg-bg">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Logo placeholder */}
          <div className="h-8 w-8 rounded-lg animate-pulse bg-bg-muted dark:bg-bg-surface" />
          {/* Avatar placeholder */}
          <div className="h-8 w-8 rounded-full animate-pulse bg-bg-muted dark:bg-bg-surface" />
        </header>

        {/* Control Bar */}
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between gap-2 pt-2 pb-4 sm:pb-6">
            {/* Left side: Add button + Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Add Button skeleton */}
              <div className="h-9 w-9 rounded-md animate-pulse bg-bg-muted dark:bg-bg-surface" />
              {/* Vertical Divider */}
              <div className="h-8 w-px bg-border-muted" />
              {/* Title skeleton */}
              <div className="h-6 w-24 rounded animate-pulse bg-bg-muted dark:bg-bg-surface" />
            </div>
            {/* Right side: Search + Options */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Search skeleton */}
              <div className="h-9 w-32 sm:w-48 md:w-[250px] rounded-lg animate-pulse bg-bg-muted dark:bg-bg-surface" />
              {/* Options skeleton */}
              <div className="hidden sm:flex h-9 w-9 rounded-md animate-pulse bg-bg-muted dark:bg-bg-surface" />
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_150px] gap-1 items-center text-xs font-medium text-fg-subtle select-none pt-2 pb-3">
            <div className="h-3 w-10 rounded animate-pulse bg-bg-muted dark:bg-bg-surface" />
            <div className="h-3 w-14 rounded animate-pulse bg-bg-muted dark:bg-bg-surface ml-auto" />
          </div>
          {/* Divider line */}
          <div className="-mx-6 border-b border-border-muted" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-6 pb-32 sm:pb-28">
        <div className="-mx-2">
          <LinkListSkeleton />
        </div>
      </div>
    </div>
  );
}
