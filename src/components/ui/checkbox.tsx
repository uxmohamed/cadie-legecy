"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui-components/react/checkbox";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border border-slate-200 bg-white bg-clip-padding shadow-xs outline-none ring-slate-950 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(0.25rem-1px)] not-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 aria-invalid:border-red-500/36 focus-visible:aria-invalid:border-red-500/64 focus-visible:aria-invalid:ring-red-500/48 dark:not-data-checked:bg-slate-200/32 dark:bg-clip-border dark:aria-invalid:ring-red-500/24 dark:not-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)] [&:is(:disabled,[data-checked],[aria-invalid])]:shadow-none dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-300 dark:focus-visible:ring-offset-slate-950 dark:aria-invalid:border-red-900/36 dark:focus-visible:aria-invalid:border-red-900/64 dark:focus-visible:aria-invalid:ring-red-900/48 dark:dark:not-data-checked:bg-slate-800/32 dark:dark:aria-invalid:ring-red-900/24",
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="-inset-px absolute flex items-center justify-center rounded-[0.25rem] text-slate-50 data-unchecked:hidden data-checked:bg-slate-900 data-indeterminate:text-slate-950 dark:text-slate-900 dark:data-checked:bg-slate-50 dark:data-indeterminate:text-slate-50"
        data-slot="checkbox-indicator"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <svg
                className="size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.252 12h13.496" />
              </svg>
            ) : (
              <svg
                className="size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
              </svg>
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
