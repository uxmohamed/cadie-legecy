"use client";

export function LinkListEmpty() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-neutral-400">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-50"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-900">No links yet</p>
        <p className="mt-1 text-xs text-neutral-400">
          Start by adding a link using the input above
        </p>
      </div>
    </div>
  );
}
