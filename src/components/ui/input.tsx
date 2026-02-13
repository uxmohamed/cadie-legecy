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
            "relative inline-flex w-full rounded-lg border border-border bg-bg-input bg-clip-padding text-base/5 ring-border-emphasis/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-ring-offset has-disabled:opacity-50 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="input-control"
    >
      <input
        className={cn(
          "w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none placeholder:text-fg-subtle",
          size === "sm" &&
            "px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)]",
          size === "lg" && "py-[calc(--spacing(2)-1px)]",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "text-fg-muted file:me-3 file:bg-transparent file:font-medium file:text-fg file:text-sm",
        )}
        data-slot="input"
        type={type}
        {...props}
      />
    </span>
  );
}

export { Input, type InputProps };
