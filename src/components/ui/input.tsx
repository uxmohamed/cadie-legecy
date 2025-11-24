import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
};

function Input({
  className,
  size = "default",
  unstyled = false,
  type,
  ...props
}: InputProps) {
  return (
    <span
      className={
        cn(
          !unstyled &&
            "relative inline-flex w-full rounded-lg border border-slate-200 bg-white bg-clip-padding text-base/5 shadow-xs ring-slate-950/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-red-500/64 has-focus-visible:has-aria-invalid:ring-red-500/16 has-aria-invalid:border-red-500/36 has-focus-visible:border-slate-950 has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm dark:bg-slate-200/32 dark:not-in-data-[slot=group]:bg-clip-border dark:has-aria-invalid:ring-red-500/24 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)] dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-300/24 dark:has-focus-visible:has-aria-invalid:border-red-900/64 dark:has-focus-visible:has-aria-invalid:ring-red-900/16 dark:has-aria-invalid:border-red-900/36 dark:has-focus-visible:border-slate-300 dark:dark:bg-slate-800/32 dark:dark:has-aria-invalid:ring-red-900/24",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="input-control"
    >
      <input
        className={cn(
          "w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none placeholder:text-slate-500/64 dark:placeholder:text-slate-400/64",
          size === "sm" &&
            "px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)]",
          size === "lg" && "py-[calc(--spacing(2)-1px)]",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "text-slate-500 file:me-3 file:bg-transparent file:font-medium file:text-slate-950 file:text-sm dark:text-slate-400 dark:file:text-slate-50",
        )}
        data-slot="input"
        type={type}
        {...props}
      />
    </span>
  );
}

export { Input, type InputProps };
