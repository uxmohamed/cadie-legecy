"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer relative inline-flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border border-neutral-200 bg-white bg-clip-padding shadow-xs outline-none ring-neutral-950 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(0.25rem-1px)] not-disabled:not-data-[state=checked]:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 aria-invalid:border-red-500/36 focus-visible:aria-invalid:border-red-500/64 focus-visible:aria-invalid:ring-red-500/48 dark:not-data-[state=checked]:bg-neutral-200/32 dark:bg-clip-border dark:aria-invalid:ring-red-500/24 dark:not-disabled:not-data-[state=checked]:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)] [&:is(:disabled,[data-state=checked],[aria-invalid])]:shadow-none dark:border-neutral-800 dark:bg-neutral-950 dark:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950 dark:aria-invalid:border-red-900/36 dark:focus-visible:aria-invalid:border-red-900/64 dark:focus-visible:aria-invalid:ring-red-900/48 dark:dark:not-data-[state=checked]:bg-neutral-800/32 dark:dark:aria-invalid:ring-red-900/24",
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "-inset-px absolute flex items-center justify-center rounded-[0.25rem] text-neutral-50 data-[state=unchecked]:hidden data-[state=checked]:bg-neutral-900 data-[state=indeterminate]:text-neutral-950 dark:text-neutral-900 dark:data-[state=checked]:bg-neutral-50 dark:data-[state=indeterminate]:text-neutral-50",
        )}
        data-slot="checkbox-indicator"
      >
        {props.checked === "indeterminate" ? (
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
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
