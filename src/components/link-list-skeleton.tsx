export function LinkListSkeleton() {
  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 mb-8 grid grid-cols-[1fr_auto] gap-4 bg-[var(--bg-l0-solid)] py-4 text-xs font-medium text-[var(--text-tertiary)]">
        <div>Title</div>
        <div>Created at</div>
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded bg-[var(--bg-l1-solid)]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--bg-l1-solid)]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-l1-solid)]" />
              </div>
            </div>
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--bg-l1-solid)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

