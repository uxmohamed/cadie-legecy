export function LinkItemSkeleton() {
  return (
    <div className="group/item relative flex items-center gap-2 w-full">
      <div className="group relative flex-1 grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_150px] ease-in items-center gap-1 rounded-lg py-4 px-2 select-none">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded bg-[var(--grey-200)] dark:bg-[var(--grey-700)]" />
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <div className="h-[15px] w-[60%] animate-pulse rounded bg-[var(--grey-200)] dark:bg-[var(--grey-700)]" />
            <div className="h-[15px] w-[40%] animate-pulse rounded bg-[var(--grey-200)] dark:bg-[var(--grey-700)] opacity-50" />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <div className="h-[13px] w-16 animate-pulse rounded bg-[var(--grey-200)] dark:bg-[var(--grey-700)]" />
        </div>
      </div>
    </div>
  );
}
